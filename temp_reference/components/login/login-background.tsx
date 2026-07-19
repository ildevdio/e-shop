"use client";

import dynamic from "next/dynamic";
import { Leva } from "leva";

// O sistema de partículas usa Three.js/WebGL e só pode rodar no cliente.
const GL = dynamic(() => import("@/components/gl").then((m) => m.GL), {
  ssr: false,
  loading: () => <div id="webgl" className="bg-black" />,
});

export function LoginBackground() {
  return (
    <>
      <GL hovering={false} />
      <Leva hidden />
    </>
  );
}
