'use client';

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    dark: {
      palette: {
        primary: {
          main: '#A8D97F',
          contrastText: '#1A3A05',
        },
        secondary: {
          main: '#E8A838',
          contrastText: '#3D2800',
        },
        background: {
          default: '#0A0A0A',
          paper: '#141414',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A3A3A3',
        },
      },
    },
    light: {
      palette: {
        primary: {
          main: '#1A3A05',
          contrastText: '#A8D97F',
        },
        secondary: {
          main: '#3D2800',
          contrastText: '#E8A838',
        },
        background: {
          default: '#F3EFE7',
          paper: '#FFFFFF',
        },
        text: {
          primary: '#201815',
          secondary: '#504540',
        },
      },
    },
  },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    h1: { fontFamily: '"Syne", sans-serif', fontWeight: 800 },
    h2: { fontFamily: '"Syne", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Syne", sans-serif', fontWeight: 700 },
    h4: { fontFamily: '"Syne", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Syne", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Syne", sans-serif', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          backgroundColor: '#141414',
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme;
