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

export const Home = {};

export const Analysis = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/analysis"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export const History = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/history"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export const Auth = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/auth"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};
