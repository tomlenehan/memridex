import { FiAward, FiHome, FiMapPin, FiUsers } from "react-icons/fi"

export const storyStarters = [
  {
    topic: "childhood",
    category: "Childhood",
    title: "A memory from growing up",
    description: "A family tradition, a favorite day, or a place you remember.",
    icon: FiHome,
    color: "#FFF0BD",
  },
  {
    topic: "people",
    category: "Influences",
    title: "Someone special",
    description: "Think of someone who made a difference in your life.",
    icon: FiUsers,
    color: "#E6DCF0",
  },
  {
    topic: "places",
    category: "Special Places",
    title: "A favorite place",
    description: "Remember a place where something meaningful happened.",
    icon: FiMapPin,
    color: "#D5EADD",
  },
  {
    topic: "proud",
    category: "Achievements",
    title: "A moment you felt proud",
    description: "Tell the story of something you worked hard to do.",
    icon: FiAward,
    color: "#F8DDCB",
  },
] as const

export type StoryStarterTopic = (typeof storyStarters)[number]["topic"]
