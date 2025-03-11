import { getSession, requireAuth } from "@/lib/authActions";
import { fetchData } from "@/lib/functions";
import { postMedia } from "@/models/mediaModel";
import { MediaItem, MediaResponse, UploadResponse } from "hybrid-types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  requireAuth();
  try {
    // get the form data from the request
    const formData = await request.formData();
    // get the token from the cookie
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // send the form data to the upload server. See apiHooks from previous classes.
    const options = {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
      },
      body: formData,
    };

    console.log("Request Headers:", options.headers);

    const uploadResult = await fetchData<UploadResponse>(
      process.env.UPLOAD_SERVER + "/upload",
      options
    );
    // if the upload response is not valid, return an error response with NextResponse
    if (!uploadResult) {
      return new NextResponse("Error uploading media", { status: 500 });
    }
    // get title and description from the form data
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    // get the filename, filesize and media_type from the upload response
    const filename = uploadResult.data.filename;
    const filesize = uploadResult.data.filesize;
    const media_type = uploadResult.data.media_type;
    // get user_id from getSession() function
    const user = await getSession();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // create a media item object, see what postMedia funcion in mediaModel wants for input.
    const mediaItem: Omit<
      MediaItem,
      "media_id" | "created_at" | "thumbnail" | "screenshots"
    > = {
      user_id: user.user_id,
      title,
      description,
      filename,
      media_type,
      filesize,
    };
    // use the postMedia function from the mediaModel to add the media to the database. Since we are putting data to the database in the same app, we dont need to use a token.
    const postResult = await postMedia(mediaItem);

    if (!postResult) {
      return new NextResponse("Error adding media to database", {
        status: 500,
      });
    }

    const uploadResponse: MediaResponse = {
      message: "Media added to database",
      media: postResult,
    };

    return new NextResponse(JSON.stringify(uploadResponse), {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error((error as Error).message, error);
    return new NextResponse((error as Error).message, { status: 500 });
  }
}
