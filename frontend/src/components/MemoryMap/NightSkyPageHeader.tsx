import { Box, Heading, Text } from "@chakra-ui/react"

export default function NightSkyPageHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Box mb={{ base: 5, md: 6 }}>
      <Heading
        as="h1"
        fontFamily={'"Iowan Old Style", "Palatino Linotype", Georgia, serif'}
        fontSize={{ base: "3xl", md: "4xl" }}
        lineHeight="1.08"
      >
        {title}
      </Heading>
      <Text color="#61777A" fontSize={{ base: "md", md: "lg" }} mt={2}>
        {description}
      </Text>
    </Box>
  )
}
