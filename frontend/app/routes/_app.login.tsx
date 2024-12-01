import { json } from "@remix-run/node";
import * as React from "react";
import { useLoaderData } from "@remix-run/react";
import Login from "../old-app/components/Login";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

export async function loader() {
  const siteKey = process.env.RECAPTCHA_SITE_KEY;
  const nodeEnv = process.env.NODE_ENV;
  console.log('Environment:', nodeEnv);
  console.log('RECAPTCHA_SITE_KEY:', siteKey);
  
  if (!siteKey) {
    throw new Error('Missing RECAPTCHA_SITE_KEY environment variable');
  }
  
  return json({
    RECAPTCHA_SITE_KEY: siteKey,
    ENV: nodeEnv,
  });
}

export default function LoginPage() {
  const data = useLoaderData<typeof loader>();
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!data.RECAPTCHA_SITE_KEY) {
    return (
      <div>
        <Typography color="error">
          Error: ReCAPTCHA configuration is missing. Environment: {data.ENV}
        </Typography>
      </div>
    );
  }
  
  // Only render the Login component on the client side
  if (!isClient) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </div>
    );
  }

  return <Login recaptchaSiteKey={data.RECAPTCHA_SITE_KEY} onLogin={() => {}} />;
}
