import React from "react";

const size = 45;

export default function CoincentricCircles() {
  return (
    <div
      className="
      relative
      w-full
      max-w-[800px]  /* Constrain the width so circles won't drift on big screens */
      h-[100vh]
      mx-auto        /* Center the container horizontally */
      flex items-center justify-center
      bg-white
    "
    >
      {/* Circle 1 */}
      <div
        className="
        absolute
        top-[50%]
        left-[35%]
        -translate-x-1/2
        -translate-y-1/2
        w-[45vh] h-[45vh]
        bg-cpg-teal/25
        rounded-full
        opacity-60
        flex items-center justify-center
        text-cpg-teal font-semibold
      "
      >
        BRANDS
      </div>

      {/* Circle 2 */}
      <div
        className="
        absolute
        top-[50%]
        left-[65%]
        -translate-x-1/2
        -translate-y-1/2
        w-[45vh] h-[45vh]
        bg-cpg-teal/25
        rounded-full
        opacity-60
        flex items-center justify-center
        text-cpg-teal font-semibold
      "
      >
        SERVICES
      </div>

      {/* Circle 3 */}
      <div
        className="
        absolute
        top-[30%]
        left-[50%]
        -translate-x-1/2
        -translate-y-9/12
        w-[45vh] h-[45vh]
        bg-cpg-teal/25
        rounded-full
        opacity-60
        flex items-center justify-center
        text-cpg-teal font-semibold
      "
      >
        FRACTIONAL TALENT
      </div>

      {/* Center intersection (optional) */}
      <div
        className="
        absolute
        top-[37.7%]
        left-[50%]
        -translate-x-1/2
        -translate-y-1/2
        w-15 h-15
        bg-cpg-teal
        rounded-full
        text-white
        flex items-center justify-center
        font-bold
      "
      >
        {/* Intersection */}
      </div>
    </div>
  );
}
