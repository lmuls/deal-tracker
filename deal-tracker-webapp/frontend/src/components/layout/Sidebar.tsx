import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import DashboardIcon from '@mui/icons-material/GridViewRounded';
import LanguageIcon from '@mui/icons-material/TravelExploreRounded';
import SettingsIcon from '@mui/icons-material/TuneRounded';
import { useNavigate, useLocation } from 'react-router-dom';

interface Props {
  width: number;
  topBarHeight: number;
}

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Sites', path: '/sites', icon: <LanguageIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

export default function Sidebar({ width }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width, boxSizing: 'border-box' },
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          px: 2.5,
          borderBottom: '1px solid #1E2030',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            backgroundColor: '#F5A623',
            borderRadius: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            mr: 1.5,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Syne", sans-serif',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#07080D',
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}
          >
            %
          </Typography>
        </Box>
        <Typography
          sx={{
            fontFamily: '"Syne", sans-serif',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: '#E8E9F3',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          DealTracker
        </Typography>
      </Box>

      {/* Nav */}
      <Box sx={{ pt: 1.5, px: 1 }}>
        {navItems.map(({ label, path, icon }) => {
          const active = location.pathname.startsWith(path);
          return (
            <Box
              key={path}
              onClick={() => navigate(path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.5,
                py: 1.1,
                mb: 0.25,
                borderRadius: 2,
                cursor: 'pointer',
                position: 'relative',
                color: active ? '#F5A623' : '#8890A8',
                backgroundColor: active ? 'rgba(245, 166, 35, 0.09)' : 'transparent',
                transition: 'all 0.14s ease',
                userSelect: 'none',
                '&:hover': {
                  backgroundColor: active ? 'rgba(245, 166, 35, 0.12)' : '#13141D',
                  color: active ? '#F5A623' : '#E8E9F3',
                },
              }}
            >
              {active && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: -8,
                    top: '18%',
                    bottom: '18%',
                    width: 3,
                    backgroundColor: '#F5A623',
                    borderRadius: '0 3px 3px 0',
                  }}
                />
              )}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  '& .MuiSvgIcon-root': { fontSize: '1.05rem' },
                }}
              >
                {icon}
              </Box>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: active ? 600 : 400,
                  letterSpacing: '0.005em',
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Drawer>
  );
}
