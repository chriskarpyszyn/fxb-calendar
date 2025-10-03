import { render, screen } from '@testing-library/react';
import App from './App';

test('renders loading message initially', () => {
  render(<App />);
  const loadingElement = screen.getByText(/loading schedule/i);
  expect(loadingElement).toBeInTheDocument();
});

test('renders app title when loaded', async () => {
  // Mock fetch to return test data
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        month: 10,
        year: 2025,
        streams: {
          "1": {
            category: "Test Category",
            subject: "Test Stream",
            time: "7:00pm - 9:00pm EST"
          }
        },
        categories: {
          "Test Category": {
            bg: "bg-purple-100",
            border: "border-purple-400",
            text: "text-purple-800",
            dot: "bg-purple-500"
          }
        }
      }),
    })
  );

  render(<App />);
  
  // Wait for the loading to complete and title to appear
  const titleElement = await screen.findByText(/itsFlannelBeard/i);
  expect(titleElement).toBeInTheDocument();
  
  // Clean up
  global.fetch.mockRestore();
});
