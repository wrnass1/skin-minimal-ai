import { MemoryRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

export default {
  title: "Pages/App",
  component: App,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
};

export const Analysis = {};

export const History = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/history"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export const About = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/about"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};
