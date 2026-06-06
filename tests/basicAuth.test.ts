import { describe, it, expect } from "vitest";
import { verifyBasicAuth } from "@/lib/basicAuth";

describe("verifyBasicAuth", () => {
  const expected = { user: "admin", password: "supersecret123" };

  it("accepts correct creds", () => {
    const header = "Basic " + Buffer.from("admin:supersecret123").toString("base64");
    expect(verifyBasicAuth(header, expected)).toBe(true);
  });

  it("rejects wrong password", () => {
    const header = "Basic " + Buffer.from("admin:wrong").toString("base64");
    expect(verifyBasicAuth(header, expected)).toBe(false);
  });

  it("rejects wrong user", () => {
    const header = "Basic " + Buffer.from("root:supersecret123").toString("base64");
    expect(verifyBasicAuth(header, expected)).toBe(false);
  });

  it("rejects missing header", () => {
    expect(verifyBasicAuth(null, expected)).toBe(false);
    expect(verifyBasicAuth("", expected)).toBe(false);
  });

  it("rejects malformed header", () => {
    expect(verifyBasicAuth("Bearer abc", expected)).toBe(false);
    expect(verifyBasicAuth("Basic not-base64", expected)).toBe(false);
  });
});
