/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { NextApiResponse } from 'next';

export default async (_, res: NextApiResponse) => {
  res.clearPreviewData();

  res.writeHead(307, { Location: '/' });
  res.end();
};
