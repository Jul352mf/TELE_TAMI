"use client";

import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";
import Github from "./logos/GitHub";
import pkg from "@/package.json";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const Nav = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={"fixed top-0 right-0 px-4 py-2 flex items-center h-14 z-50"}
    >
      <div className={"ml-auto flex items-center gap-1"}>
        <Button
          onClick={() => {
            window.open(pkg.homepage, "_blank", "noopener noreferrer");
          }}
          variant={"ghost"}
          className={"ml-auto flex items-center gap-1.5 rounded-full"}
        >
          <span>
            <Github className={"size-4"} />
          </span>
          <span>Star on GitHub</span>
        </Button>
        <Button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          variant={"ghost"}
          className={"ml-auto flex items-center gap-1.5 rounded-full"}
        >
          {mounted ? (
            <>
              <span>
                {theme === "dark" ? (
                  <Sun className={"size-4"} />
                ) : (
                  <Moon className={"size-4"} />
                )}
              </span>
              <span>{theme === "dark" ? "Light" : "Dark"} Mode</span>
            </>
          ) : (
            // Avoid SSR/CSR mismatch by rendering a neutral placeholder before mount
            <span className={"w-[64px] h-4"} />
          )}
        </Button>
      </div>
    </div>
  );
};
