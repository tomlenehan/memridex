import {
  Box,
  Container,
  Heading,
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

import type { UserPublic } from "../../client"
import Appearance from "../../components/UserSettings/Appearance"
import ChangePassword from "../../components/UserSettings/ChangePassword"
import DeleteAccount from "../../components/UserSettings/DeleteAccount"
import UserInformation from "../../components/UserSettings/UserInformation"
import Contacts from "../../components/UserSettings/Contacts" // Import Contacts component

const tabsConfig = [
  { title: "My profile", component: UserInformation },
  { title: "Password", component: ChangePassword },
  { title: "Address Book", component: Contacts },
  { title: "Appearance", component: Appearance },
  { title: "Danger zone", component: DeleteAccount },
]

export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings() {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const finalTabs = currentUser?.is_superuser
    ? tabsConfig.slice(0, 3)
    : tabsConfig

  return (
    <Container maxW="7xl" px={0}>
      <Stack spacing={6}>
        <Box>
          <Text color="ui.main" fontWeight="bold" mb={2}>
            Account
          </Text>
          <Heading size="xl" letterSpacing={0}>
            Settings
          </Heading>
          <Text color="ui.muted" mt={3} maxW="680px">
            Manage profile details, saved contacts, appearance, and account
            preferences.
          </Text>
        </Box>
        <Box
          bg="white"
          border="1px solid"
          borderColor="ui.line"
          borderRadius="8px"
          boxShadow="0 14px 32px rgba(31, 41, 51, 0.06)"
          overflow="hidden"
        >
          <Tabs variant="enclosed">
            <TabList bg="ui.secondary" px={4} pt={4}>
              {finalTabs.map((tab, index) => (
                <Tab
                  key={index}
                  borderTopRadius="8px"
                  _selected={{ color: "ui.mainDark", bg: "white" }}
                >
                  {tab.title}
                </Tab>
              ))}
            </TabList>
            <TabPanels>
              {finalTabs.map((tab, index) => (
                <TabPanel key={index} p={{ base: 4, md: 6 }}>
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
