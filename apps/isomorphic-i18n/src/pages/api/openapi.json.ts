import { openApiDocument } from "@isomorphic/api";
import type { NextApiRequest, NextApiResponse } from "next";

// Respond with our OpenAPI schema
const handler = (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).send(openApiDocument);
};

export default handler;
