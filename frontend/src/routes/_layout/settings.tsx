import {
  Avatar,
  Box,
  Container,
  Flex,
  Heading,
  Icon,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FiAlertTriangle, FiLock, FiUser } from "react-icons/fi"

import type { UserPublic } from "../../client"
import ChangePassword from "../../components/UserSettings/ChangePassword"
import DeleteAccount from "../../components/UserSettings/DeleteAccount"
import UserInformation from "../../components/UserSettings/UserInformation"
import ProgressTrail from "../../components/Progress/ProgressTrail"
import { profileImageSrc } from "../../utils/profileImage"

const tabsConfig = [
  { title: "My profile", component: UserInformation, icon: FiUser },
  { title: "Password", component: ChangePassword, icon: FiLock },
  // Address Book is intentionally hidden until the feature is needed again.
  { title: "Danger zone", component: DeleteAccount, icon: FiAlertTriangle },
]

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const visibleTabs = currentUser?.is_superuser
    ? tabsConfig.filter((tab) => tab.title !== "Danger zone")
    : tabsConfig

  return (
    <Container maxW="7xl" px={0}>
      <Stack spacing={6}>
        <Box
          bg="linear-gradient(110deg, #173E4A, #205D5A)"
          border="1px solid #355B64"
          borderRadius="8px"
          boxShadow="0 12px 30px rgba(20, 53, 58, 0.14)"
          color="#FFF9EA"
          px={{ base: 5, md: 7 }}
          py={{ base: 5, md: 6 }}
        >
          <Flex align="center" gap={4}>
            <Avatar
              name={
                currentUser?.full_name || currentUser?.email || "Your account"
              }
              src={profileImageSrc(currentUser?.profile_image_url)}
              size="lg"
              bg="#DDE5D9"
              color="#17353B"
              border="2px solid #F5D785"
            />
            <Box>
              <Text
                color="#F5D785"
                fontSize="xs"
                fontWeight="900"
                letterSpacing=".1em"
              >
                YOUR ACCOUNT
              </Text>
              <Heading size="lg" letterSpacing={0} mt={1}>
                Profile and progress
              </Heading>
              <Text color="#D0E2D9" mt={1}>
                {currentUser?.full_name || currentUser?.email}
              </Text>
            </Box>
          </Flex>
        </Box>
        <ProgressTrail />
        <Box
          bg="white"
          border="1px solid"
          borderColor="ui.line"
          borderRadius="8px"
          boxShadow="0 14px 32px rgba(31, 41, 51, 0.06)"
          overflow="hidden"
        >
          <Tabs variant="enclosed">
            <TabList
              bg="ui.secondary"
              px={{ base: 2, md: 4 }}
              pt={4}
              display="grid"
              gridTemplateColumns={{
                base: "1fr",
                sm: `repeat(${visibleTabs.length}, minmax(0, 1fr))`,
              }}
              gap={1}
            >
              {visibleTabs.map((tab) => (
                <Tab
                  key={tab.title}
                  borderTopRadius="8px"
                  minH="48px"
                  px={2}
                  whiteSpace="normal"
                  gap={2}
                  _selected={{
                    color: "ui.mainDark",
                    bg: "white",
                    boxShadow: "inset 0 3px #D9954C",
                  }}
                >
                  <Icon as={tab.icon} />
                  {tab.title}
                </Tab>
              ))}
            </TabList>
            <TabPanels>
              {visibleTabs.map((tab) => (
                <TabPanel key={tab.title} p={{ base: 4, md: 7 }}>
                  <tab.component />
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </Box>
      </Stack>
    </Container>
  )
}

export default UserSettings
