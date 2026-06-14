import { describe, expect, it, vi } from "vitest";
import { uploadToBucket } from "./storage.js";

const makeSupabase = ({ uploadResult, publicUrl }) => {
  const upload = vi.fn().mockResolvedValue(uploadResult);
  const getPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl } });
  return {
    storage: { from: vi.fn().mockReturnValue({ upload, getPublicUrl }) },
    _upload: upload,
    _getPublicUrl: getPublicUrl,
  };
};

const file = new File(["x"], "Photo.PNG");

describe("uploadToBucket", () => {
  it("uploads to <folder>/<prefix>-<rand>-<id>.<ext> and returns the public URL", async () => {
    const sb = makeSupabase({
      uploadResult: { error: null },
      publicUrl: "https://cdn/x.png",
    });

    const url = await uploadToBucket(sb, {
      bucket: "company-logo",
      folder: "brands",
      file,
      prefix: "company",
      identifier: "user_1",
    });

    expect(url).toBe("https://cdn/x.png");
    expect(sb.storage.from).toHaveBeenCalledWith("company-logo");

    const path = sb._upload.mock.calls[0][0];
    expect(path).toMatch(/^brands\/company-\d+-user_1\.png$/);
  });

  it("omits the folder prefix when folder is empty", async () => {
    const sb = makeSupabase({
      uploadResult: { error: null },
      publicUrl: "https://cdn/job.pdf",
    });

    await uploadToBucket(sb, {
      bucket: "job-descriptions",
      folder: "",
      file: new File(["x"], "doc.PDF"),
      prefix: "job",
      identifier: "u",
    });

    const path = sb._upload.mock.calls[0][0];
    expect(path).toMatch(/^job-\d+-u\.pdf$/);
  });

  it("throws when the upload errors", async () => {
    const sb = makeSupabase({
      uploadResult: { error: { message: "denied" } },
      publicUrl: null,
    });

    await expect(
      uploadToBucket(sb, {
        bucket: "b",
        folder: "f",
        file,
        prefix: "p",
        identifier: "i",
      }),
    ).rejects.toThrow("denied");
  });
});
