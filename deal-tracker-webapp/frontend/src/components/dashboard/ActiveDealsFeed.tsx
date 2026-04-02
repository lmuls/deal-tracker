import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { useNavigate } from "react-router-dom";
import type { DealResponse } from "../../api/generated";
import ConfidenceBadge from "../common/ConfidenceBadge";
import DealTypeBadge from "../common/DealTypeBadge";
import TimeAgo from "../common/TimeAgo";

interface Props {
  deals: DealResponse[];
  loading: boolean;
}

export default function ActiveDealsFeed({ deals, loading }: Props) {
  const navigate = useNavigate();

  return (
    <Card elevation={1} sx={{ mb: 3 }}>
      <CardHeader
        title="Active Deals"
        titleTypographyProps={{ variant: "h6", fontWeight: 600 }}
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 0, px: 0, "&:last-child": { pb: 0 } }}>
        {loading ? (
          <Box sx={{ p: 2 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : deals.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              No active deals detected
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {deals.map((deal, idx) => (
              <Box key={deal.id}>
                {idx > 0 && <Divider />}
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "action.hover" },
                    py: 1.5,
                  }}
                  onClick={() => navigate(`/sites/${deal.siteId}`)}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "center",
                          flexWrap: "wrap",
                          mb: 0.5,
                        }}
                      >
                        <ConfidenceBadge confidence={deal.confidence} />
                        <DealTypeBadge type={deal.type} />
                        <Typography variant="body2" fontWeight={600}>
                          {deal.siteName}
                        </Typography>
                        {deal.discountValue && (
                          <Typography
                            variant="body2"
                            color="primary"
                            fontWeight={700}
                          >
                            {deal.discountValue}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box component="span">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component="span"
                          display="block"
                        >
                          {deal.title ?? deal.description ?? "Deal detected"}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          component="span"
                        >
                          Detected <TimeAgo dateString={deal.detectedAt} />
                          {deal.expiresAt && (
                            <>
                              {" "}
                              · Expires{" "}
                              {new Date(deal.expiresAt).toLocaleDateString()}
                            </>
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
