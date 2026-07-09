import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import api from "../services/api";

jest.mock("../services/api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    defaults: { headers: { common: {} } },
  },
}));

const TestConsumer = () => {
  const { user, error, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.email : "no-user"}</span>
      <span data-testid="error">{error || "no-error"}</span>
      <button onClick={() => login("test@example.com", "password123")}>Login</button>
      <button onClick={() => register("Test User", "test@example.com", "password123")}>
        Register
      </button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

const renderWithProvider = () =>
  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );

describe("AuthContext - Tests Complets", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    window.history.pushState({}, "", "/");
  });

  it("starts with no user when there is no token", () => {
    renderWithProvider();
    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
  });

  it("logs in successfully and updates the user", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: "fake-jwt-token",
        user: { id: "1", email: "test@example.com", name: "Test" },
      },
    });

    renderWithProvider();
    await act(async () => {
      await userEvent.click(screen.getByText("Login"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
    });
    expect(localStorage.getItem("token")).toBe("fake-jwt-token");
  });

  it("sets an error message when login fails", async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials" } },
    });

    renderWithProvider();
    await act(async () => {
      await userEvent.click(screen.getByText("Login"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Invalid credentials");
    });
    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
  });

  it("registers successfully and stores the token", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: "new-user-token",
        user: { id: "2", email: "test@example.com", name: "Test User" },
      },
    });

    renderWithProvider();
    await act(async () => {
      await userEvent.click(screen.getByText("Register"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
    });
    expect(localStorage.getItem("token")).toBe("new-user-token");
  });

  it("logs out and clears the token and user", async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: "fake-jwt-token",
        user: { id: "1", email: "test@example.com", name: "Test" },
      },
    });

    renderWithProvider();
    await act(async () => {
      await userEvent.click(screen.getByText("Login"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
    });

    await act(async () => {
      await userEvent.click(screen.getByText("Logout"));
    });

    expect(screen.getByTestId("user")).toHaveTextContent("no-user");
    expect(localStorage.getItem("token")).toBeNull();
  });
});
