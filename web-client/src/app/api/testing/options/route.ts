import { NextResponse } from "next/server";
import { AppError, toErrorMessage } from "../../../../../backend/core/errors";
import { testingOptionsFacade } from "../../../../../backend/modules/testing/facades/testing-options.facade";

export async function GET() {
  try {
    const options = await testingOptionsFacade.getAllOptions();
    return NextResponse.json(options, { status: 200 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
