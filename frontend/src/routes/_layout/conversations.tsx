import {
    Box,
    Button,
    Container,
    Heading,
    Image,
    Skeleton,
    Text,
    useDisclosure,
    SimpleGrid,
    Flex,
    Spacer
} from "@chakra-ui/react";
import {useQuery} from "@tanstack/react-query";
import {createFileRoute, Link} from "@tanstack/react-router";
import {ErrorBoundary} from "react-error-boundary";
import {
    UserStoryPromptsService,
    UserStoryPromptPublic,
    ConversationsService,
    SummariesService
} from "../../client";
import AddConversation from "../../components/Conversations/AddConversation";
import {useState} from "react";

export const Route = createFileRoute("/_layout/conversations")({
    component: Conversations,
});

function UserStoryPromptsList() {
    const {data: userStoryPrompts, isLoading, error} = useQuery({
        queryKey: ["userStoryPrompts"],
        queryFn: () => UserStoryPromptsService.readUserStoryPrompts({}),
    });

    const {data: conversationsData, isLoading: conversationsLoading} = useQuery({
        queryKey: ["conversations"],
        queryFn: () => ConversationsService.readConversations({}),
    });

    const {data: summariesData, isLoading: summariesLoading} = useQuery({
        queryKey: ["summaries"],
        queryFn: () => SummariesService.readStorySummaries({}),
    });

    const {isOpen, onOpen, onClose} = useDisclosure();
    const [selectedPrompt, setSelectedPrompt] = useState<UserStoryPromptPublic | null>(null);

    const handleStartConversation = (prompt: UserStoryPromptPublic) => {
        setSelectedPrompt(prompt);
        onOpen();
    };

    if (isLoading || conversationsLoading || summariesLoading) {
        return (
            <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                {new Array(6).fill(null).map((_, index) => (
                    <Box
                        key={index}
                        maxW="sm"
                        borderWidth="1px"
                        borderRadius="lg"
                        overflow="hidden"
                    >
                        <Skeleton height="200px"/>
                        <Box p={6}>
                            <Skeleton height="20px" width="70%"/>
                            <Skeleton height="20px" width="50%" mt={2}/>
                            <Skeleton height="20px" width="60%" mt={2}/>
                            <Skeleton height="40px" width="100%" mt={4}/>
                        </Box>
                    </Box>
                ))}
            </SimpleGrid>
        );
    }

    if (error) {
        return (
            <Box textAlign="center" color="red.500">
                Something went wrong: {error.message}
            </Box>
        );
    }

    const conversations = conversationsData?.data || [];
    const summaries = summariesData || [];

    const getConversationForPrompt = (promptId: number) => {
        return conversations.find(conversation => conversation.user_story_prompt_id === promptId);
    };

    const getLatestSummaryForConversation = (conversationId: number) => {
        const conversationSummaries = summaries.filter(summary => summary.conversation_id === conversationId);
        return conversationSummaries.sort((a, b) => {
            if (!b.modified_at || !a.modified_at) {
                return 0;
            }
            return new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime();
        })[0];
    };

    return (
        <>
            <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                {userStoryPrompts?.data.map((prompt) => {
                    const existingConversation = getConversationForPrompt(prompt.id);
                    const latestSummary = existingConversation && existingConversation.status === 'complete'
                        ? getLatestSummaryForConversation(existingConversation.id)
                        : null;

                    return (
                        <Box
                            key={prompt.id}
                            maxW="sm"
                            borderWidth="1px"
                            borderRadius="lg"
                            overflow="hidden"
                            display="flex"
                            flexDirection="column"
                            justifyContent="space-between"
                        >
                            {prompt.image_url ? (
                                <Image src={prompt.image_url} alt={prompt.prompt}/>
                            ) : (
                                <Skeleton height="200px"/>
                            )}
                            <Box p={6} flex="1" display="flex" flexDirection="column">
                                <Heading size="md">{prompt.prompt}</Heading>
                                {prompt.category ? (
                                    <Text mt={2} color="gray.600">
                                        Category: {prompt.category.name}
                                    </Text>
                                ) : (
                                    <Text mt={2} color="gray.600">
                                        Category: N/A
                                    </Text>
                                )}
                                <Spacer/>
                                <Flex mt={4} justifyContent="space-between" alignItems="center">
                                    {existingConversation ? (
                                        <Button as={Link}
                                                to={`/conversation/${existingConversation.id}`}
                                                colorScheme="blue">
                                            Continue
                                        </Button>
                                    ) : (
                                        <Button colorScheme="teal"
                                                onClick={() => handleStartConversation(prompt)}>
                                            Start Chat
                                        </Button>
                                    )}
                                    {latestSummary && (
                                        <Button
                                            as={Link}
                                            to={`/summary/${latestSummary.id}`}
                                            colorScheme="purple"
                                            size="md"
                                        >
                                            View
                                        </Button>
                                    )}
                                </Flex>
                            </Box>
                        </Box>
                    );
                })}
            </SimpleGrid>
            <AddConversation isOpen={isOpen} onClose={onClose} prompt={selectedPrompt}/>
        </>
    );

}

function Conversations() {
    return (
        <Container maxW="full">
            <Heading size="lg" textAlign={{base: "center", md: "left"}} pt={12}>
            </Heading>

            <ErrorBoundary
                fallbackRender={({error}) => (
                    <Box textAlign="center" color="red.500">
                        Something went wrong: {error.message}
                    </Box>
                )}
            >
                <UserStoryPromptsList/>
            </ErrorBoundary>
        </Container>
    );
}

export default Conversations;
