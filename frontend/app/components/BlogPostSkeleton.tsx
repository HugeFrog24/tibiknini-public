import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material';

export default function BlogPostSkeleton() {
  return (
    <Card sx={{ mb: 2, width: '100%' }}>
      <CardContent>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Skeleton variant="text" width={200} />
          </Box>
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="80%" />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Skeleton variant="text" width={100} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="circular" width={24} height={24} />
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
