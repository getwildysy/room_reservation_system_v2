import React from "react";
import { render } from "@testing-library/react";
import Header from "./Header";

describe("Header Component", () => {
  it("應該符合快照 (snapshot)", () => {
    // 渲染元件
    const { asFragment } = render(<Header />);

    // 產生快照並進行比對
    expect(asFragment()).toMatchSnapshot();
  });
});
