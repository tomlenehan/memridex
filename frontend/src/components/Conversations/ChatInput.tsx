import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FiMic, FiMicOff, FiSend, FiVolume2 } from "react-icons/fi"
import { GiSecretBook } from "react-icons/gi"
import { useDispatch, useSelector } from "react-redux"

import type { ChatMessageCreate, ChatMessagePublic } from "../../client"
import { API_BASE_URL } from "../../config"
import useCustomToast from "../../hooks/useCustomToast"
import { useRealtimeStory } from "../../hooks/useRealtimeStory"
import {
  addMessage,
  addStreamingMessage,
  endStreamingMessage,
  startStreamingMessage,
} from "../../redux/chatSlice"
import { fetchConversationStatus } from "../../redux/conversationSlice"
import type { AppDispatch, RootState } from "../../redux/store"
import AddSummary from "../Summaries/AddSummary"

interface ChatInputProps {
  conversationId: number
}

const statusLabels = {
  connected: "Voice conversation is ready. You can speak or type.",
  connecting: "Connecting your microphone...",
  listening: "Listening...",
  speaking: "MemriPlace is speaking...",
  thinking: "MemriPlace is gathering its next question...",
} as const

const ChatInput = ({ conversationId }: ChatInputProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ChatMessageCreate>({
    defaultValues: {
      sender_type: "user",
      content: "",
    },
  })
  const queryClient = useQueryClient()
  const dispatch = useDispatch<AppDispatch>()
  const showToast = useCustomToast()
  const streamingMessageId = useRef<number | null>(null)
  const conversationStatus = useSelector(
    (state: RootState) => state.conversation.status,
  )
  const bgColor = useColorModeValue("ui.light", "ui.dark")
  const textColor = useColorModeValue("ui.dark", "ui.light")
  const secBgColor = useColorModeValue("ui.secondary", "ui.darkSlate")
  const mutedTextColor = useColorModeValue("ui.muted", "ui.dim")
  const { isOpen, onOpen, onClose } = useDisclosure()

  const refreshConversation = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["chatMessages", conversationId],
    })
    void dispatch(fetchConversationStatus(conversationId))
  }, [conversationId, dispatch, queryClient])

  useEffect(() => {
    void dispatch(fetchConversationStatus(conversationId))
  }, [conversationId, dispatch])

  const handleStream = async (newMessage: ChatMessageCreate) => {
    const token = localStorage.getItem("access_token")
    if (!token) throw new Error("Please log in again to continue your story.")

    const tempId = Date.now() + 1
    streamingMessageId.current = tempId
    dispatch(startStreamingMessage({ id: tempId }))

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat_messages/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newMessage),
        },
      )
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.detail || "Unable to send your message.")
      }
      if (!response.body)
        throw new Error("The story assistant did not return a response.")

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        dispatch(
          addStreamingMessage({
            id: tempId,
            content: decoder.decode(value, { stream: true }),
          }),
        )
      }
    } finally {
      dispatch(endStreamingMessage())
      streamingMessageId.current = null
      refreshConversation()
    }
  }

  const handleVoiceUserMessage = useCallback(
    (message: ChatMessagePublic) => {
      dispatch(addMessage(message))
    },
    [dispatch],
  )

  const handleVoiceAssistantStart = useCallback(() => {
    if (streamingMessageId.current) return
    const tempId = Date.now() + 1
    streamingMessageId.current = tempId
    dispatch(startStreamingMessage({ id: tempId }))
  }, [dispatch])

  const handleVoiceAssistantDelta = useCallback(
    (content: string) => {
      if (!streamingMessageId.current) return
      dispatch(addStreamingMessage({ id: streamingMessageId.current, content }))
    },
    [dispatch],
  )

  const handleVoiceAssistantComplete = useCallback(() => {
    dispatch(endStreamingMessage())
    streamingMessageId.current = null
  }, [dispatch])

  const handleVoiceError = useCallback(
    (message: string) => showToast("Voice conversation", message, "error"),
    [showToast],
  )

  const {
    error: voiceError,
    isActive: isVoiceActive,
    sendText,
    start,
    status: voiceStatus,
    stop,
  } = useRealtimeStory({
    conversationId,
    onUserMessage: handleVoiceUserMessage,
    onAssistantStart: handleVoiceAssistantStart,
    onAssistantDelta: handleVoiceAssistantDelta,
    onAssistantComplete: handleVoiceAssistantComplete,
    onConversationChanged: refreshConversation,
    onError: handleVoiceError,
  })

  const onSubmit: SubmitHandler<ChatMessageCreate> = async (data) => {
    const content = data.content.trim()
    if (!content) return

    if (isVoiceActive) {
      try {
        const sent = await sendText(content)
        if (!sent) {
          throw new Error(
            "Voice conversation is still connecting. Please try again.",
          )
        }
        reset()
      } catch (error) {
        showToast(
          "Message not sent",
          error instanceof Error ? error.message : "Please try again.",
          "error",
        )
      }
      return
    }

    const newMessage = {
      id: Date.now(),
      sender_type: data.sender_type,
      content,
      timestamp: new Date().toISOString(),
    }
    dispatch(addMessage(newMessage))
    reset()

    try {
      await handleStream({ ...data, content })
    } catch (error) {
      showToast(
        "Message not sent",
        error instanceof Error ? error.message : "Please try again.",
        "error",
      )
    }
  }

  const handleVoiceToggle = () => {
    if (isVoiceActive) {
      stop()
      return
    }
    void start()
  }

  const voiceStatusLabel =
    voiceStatus in statusLabels
      ? statusLabels[voiceStatus as keyof typeof statusLabels]
      : voiceError

  return (
    <Box
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      p={4}
      bg={secBgColor}
      borderTop="1px"
      borderColor="gray.200"
      width="100%"
    >
      <Flex gap={2} align="center">
        <Input
          {...register("content", { required: true })}
          aria-label="Story message"
          placeholder={
            isVoiceActive
              ? "Type a memory while you talk..."
              : "Type a memory or question..."
          }
          bg={bgColor}
          color={textColor}
        />
        <Tooltip
          label={
            isVoiceActive
              ? "End voice conversation"
              : "Start voice conversation"
          }
        >
          <IconButton
            aria-label={
              isVoiceActive
                ? "End voice conversation"
                : "Start voice conversation"
            }
            icon={isVoiceActive ? <FiMicOff /> : <FiMic />}
            type="button"
            colorScheme={isVoiceActive ? "red" : "teal"}
            variant={isVoiceActive ? "solid" : "outline"}
            isLoading={voiceStatus === "connecting"}
            onClick={handleVoiceToggle}
          />
        </Tooltip>
        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isSubmitting}
          rightIcon={<FiSend />}
        >
          Send
        </Button>
        {(conversationStatus === "ready_for_summary" ||
          conversationStatus === "complete") && (
          <Button
            type="button"
            colorScheme="green"
            onClick={onOpen}
            rightIcon={<GiSecretBook />}
          >
            Save Memory
          </Button>
        )}
      </Flex>

      {voiceStatusLabel && (
        <HStack
          mt={3}
          spacing={2}
          color={voiceError ? "red.500" : mutedTextColor}
        >
          <Icon as={voiceError ? FiMicOff : FiVolume2} boxSize={4} />
          <Text fontSize="sm">{voiceStatusLabel}</Text>
        </HStack>
      )}

      <AddSummary
        isOpen={isOpen}
        onClose={onClose}
        conversationId={conversationId}
      />
    </Box>
  )
}

export default ChatInput
