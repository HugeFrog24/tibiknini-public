import React from 'react';
import type { MetaFunction } from "@remix-run/node";
import Home from "../components/Home";

export const meta: MetaFunction = () => {
  return [
    { title: "Welcome" },
    { name: "description", content: "Welcome to our website" },
  ];
};

export default function Index() {
  return <Home />;
}