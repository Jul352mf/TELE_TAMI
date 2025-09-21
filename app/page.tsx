import { getHumeAccessToken } from "@/utils/getHumeAccessToken";
import TeleTami from "@/components/TeleTami";

export default async function Page() {
  const accessToken = await getHumeAccessToken();

  if (!accessToken) {
    throw new Error('Unable to get access token');
  }

  return (
    <div className={"grow flex flex-col"}>
      <TeleTami accessToken={accessToken} />
    </div>
  );
}
