import { extendTheme } from "@chakra-ui/react"

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
        fontWeight: 700,
        letterSpacing: 0,
        minH: "44px",
        borderRadius: "10px",
        transition: "background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease",
        _focusVisible: {
          outline: "3px solid",
          outlineColor: "ui.accent",
          outlineOffset: "2px",
          boxShadow: "none",
        },
        _disabled: {
          opacity: 0.58,
          cursor: "not-allowed",
          transform: "none",
          boxShadow: "none",
        },
      },
      defaultProps: {
        size: "md",
        variant: "outline",
      },
      sizes: {
        sm: {
          h: "44px",
          minW: "44px",
          px: 4,
          fontSize: "sm",
          borderRadius: "9px",
        },
        md: {
          h: "48px",
          minW: "48px",
          px: 5,
          fontSize: "md",
          borderRadius: "10px",
        },
        lg: {
          h: "56px",
          minW: "56px",
          px: 6,
          fontSize: "lg",
          borderRadius: "12px",
        },
      },
      variants: {
        primary: {
          bg: "ui.mainDark",
          color: "#FFFDF7",
          border: "1px solid",
          borderColor: "ui.mainDark",
          boxShadow: "0 3px 0 #174A48, 0 6px 12px rgba(31, 94, 92, 0.14)",
          _hover: {
            bg: "ui.main",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 0 #174A48, 0 8px 16px rgba(31, 94, 92, 0.16)",
          },
          _active: {
            bg: "ui.mainDark",
            transform: "translateY(1px)",
            boxShadow: "0 1px 0 #174A48",
          },
          _disabled: {
            bg: "ui.mainDark",
            borderColor: "ui.mainDark",
          },
        },
        accent: {
          bg: "#F2C96D",
          color: "#173B3A",
          border: "1px solid #DDAF4E",
          boxShadow: "0 3px 0 #C99B3F, 0 6px 12px rgba(132, 93, 27, 0.12)",
          _hover: {
            bg: "#F7D782",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 0 #C99B3F, 0 8px 16px rgba(132, 93, 27, 0.15)",
          },
          _active: {
            bg: "#EBC05B",
            transform: "translateY(1px)",
            boxShadow: "0 1px 0 #C99B3F",
          },
          _disabled: {
            bg: "#F2C96D",
            borderColor: "#DDAF4E",
          },
        },
        secondary: {
          bg: "#EAF2ED",
          color: "ui.mainDark",
          border: "1px solid #D3E2D9",
          boxShadow: "0 2px 0 #D2DFD5",
          _hover: {
            bg: "#DFECE4",
            borderColor: "#B9D1C3",
            transform: "translateY(-1px)",
            boxShadow: "0 3px 0 #C7D9CC",
          },
          _active: {
            bg: "#D8E7DD",
            transform: "translateY(1px)",
            boxShadow: "none",
          },
          _disabled: {
            bg: "#EAF2ED",
            borderColor: "#D3E2D9",
          },
        },
        outline: {
          bg: "#FFFDF7",
          color: "ui.mainDark",
          border: "1px solid #B8CDC1",
          boxShadow: "0 2px 0 #DDE5D9",
          _hover: {
            bg: "#F5F7F0",
            borderColor: "ui.main",
            transform: "translateY(-1px)",
          },
          _active: {
            bg: "#EAF2ED",
            transform: "translateY(1px)",
            boxShadow: "none",
          },
          _disabled: {
            bg: "#FFFDF7",
            borderColor: "#B8CDC1",
          },
        },
        storyStarter: {
          h: "auto",
          minH: "132px",
          px: 6,
          py: 5,
          bg: "#FFFDF7",
          color: "ui.ink",
          border: "1px solid #E3E5D9",
          borderRadius: "14px",
          boxShadow: "0 3px 0 #E7E5D9, 0 9px 20px rgba(39, 62, 61, 0.05)",
          whiteSpace: "normal",
          textAlign: "left",
          justifyContent: "flex-start",
          _hover: {
            bg: "#FFFCF1",
            borderColor: "#D8BF7A",
            transform: "translateY(-2px)",
            boxShadow: "0 5px 0 #E4D9B9, 0 13px 24px rgba(39, 62, 61, 0.08)",
          },
          _active: {
            transform: "translateY(1px)",
            boxShadow: "0 1px 0 #E4D9B9",
          },
          _disabled: {
            bg: "#FFFDF7",
            borderColor: "#E3E5D9",
          },
        },
        danger: {
          bg: "#B94F4A",
          color: "white",
          border: "1px solid #A84440",
          boxShadow: "0 3px 0 #943B38, 0 6px 12px rgba(148, 59, 56, 0.14)",
          _hover: {
            bg: "#A84440",
            transform: "translateY(-1px)",
          },
          _disabled: {
            bg: "#B94F4A",
            borderColor: "#A84440",
          },
        },
        ghost: {
          bg: "transparent",
          color: "ui.mainDark",
          border: "1px solid transparent",
          boxShadow: "none",
          _hover: {
            bg: "#EAF2ED",
            borderColor: "#D3E2D9",
          },
          _active: {
            bg: "#DDEAE1",
          },
          _disabled: {
            bg: "transparent",
            borderColor: "transparent",
          },
        },
        link: {
          h: "auto",
          minH: "44px",
          px: 1,
          bg: "transparent",
          color: "ui.mainDark",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
          boxShadow: "none",
          _hover: {
            color: "ui.main",
            bg: "transparent",
          },
          _disabled: {
            bg: "transparent",
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
