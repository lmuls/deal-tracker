import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import CardHeader from "@mui/material/CardHeader";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { useNavigate } from "react-router-dom";
import type { SiteResponse } from "../../api/generated";
import TimeAgo from "../common/TimeAgo";

interface Props {
  sites: SiteResponse[];
  loading: boolean;
}

export default function SiteStatusGrid({ sites, loading }: Props) {
  const navigate = useNavigate();

  return (
    <Card elevation={1}>
      <CardHeader
        title="Monitored Sites"
        titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
      />
      <CardContent sx={{ pt: 0 }}>
        {loading ? (
          <Grid container spacing={2}>
            {[0, 1, 2].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton
                  height={100}
                  variant="rectangular"
                  sx={{ borderRadius: 1 }}
                />
              </Grid>
            ))}
          </Grid>
        ) : sites.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No sites tracked yet. Add one from the Sites page.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {sites.map((site) => (
              <Grid item xs={12} sm={6} md={4} key={site.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderColor: site.hasActiveDeal
                      ? "success.main"
                      : "divider",
                    borderWidth: site.hasActiveDeal ? 2 : 1,
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/sites/${site.id}`)}
                    sx={{ height: "100%", p: 1.5 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{ mb: 0.5 }}
                        noWrap
                      >
                        {site.name}
                      </Typography>
                      <FiberManualRecordIcon
                        sx={{
                          fontSize: 12,
                          color: site.hasActiveDeal
                            ? "success.main"
                            : "text.disabled",
                          mt: 0.3,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{
                        mb: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {site.url}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Chip
                        label={site.hasActiveDeal ? "Active offer" : "No offer"}
                        size="small"
                        color={site.hasActiveDeal ? "success" : "default"}
                        variant="outlined"
                      />
                      {!site.active && (
                        <Chip
                          label="Paused"
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    {site.lastCheckedAt && (
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        Last checked:{" "}
                        <TimeAgo dateString={site.lastCheckedAt} />
                      </Typography>
                    )}
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}
