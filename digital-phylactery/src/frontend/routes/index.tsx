import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { GraphView } from '../pages/GraphView';
import { SearchView } from '../pages/SearchView';
import { HistoryView } from '../pages/HistoryView';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <GraphView />,
      },
      {
        path: 'search',
        element: <SearchView />,
      },
      {
        path: 'history',
        element: <HistoryView />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
