import { extendTheme } from "@chakra-ui/react"

const disabledStyles = {
  _disabled: {
    backgroundColor: "ui.main",
  },
}

const theme = extendTheme({
  colors: {
    ui: {
      main: "#2F7D7A",
      mainDark: "#1F5E5C",
      secondary: "#F1F5F2",
      accent: "#D9954C",
      ink: "#1F2933",
      muted: "#667085",
      line: "#DDE5E1",
      success: "#48BB78",
      danger: "#E53E3E",
      light: "#FBFCFA",
      dark: "#18212B",
      darkSlate: "#25313A",
      dim: "#98A2B3",
    },
  },
  styles: {
    global: {
      body: {
        bg: "ui.light",
        color: "ui.ink",
      },
      "::selection": {
        bg: "rgba(47, 125, 122, 0.18)",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: "8px",
        fontWeight: 700,
      },
      variants: {
        primary: {
          backgroundColor: "ui.main",
          color: "ui.light",
          _hover: {
            backgroundColor: "ui.mainDark",
          },
          _disabled: {
            ...disabledStyles,
            _hover: {
              ...disabledStyles,
            },
          },
        },
        danger: {
          backgroundColor: "ui.danger",
          color: "ui.light",
          _hover: {
            backgroundColor: "#E32727",
          },
        },
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: "ui.main",
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: "ui.main",
      },
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            _selected: {
              color: "ui.main",
            },
          },
        },
      },
    },
  },
})

export default theme
