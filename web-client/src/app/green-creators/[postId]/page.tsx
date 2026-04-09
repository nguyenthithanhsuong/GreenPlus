import GreenCreatorDetails from "../../../../frontend/green-creators/components/GreenCreatorDetails";

type RouteParams = {
  postId: string;
};

export default async function GreenCreatorDetailsPage({
  params,
}: {
  params: RouteParams | Promise<RouteParams>;
}) {
  const resolvedParams = await Promise.resolve(params);
  return <GreenCreatorDetails postId={resolvedParams.postId ?? ""} />;
}
