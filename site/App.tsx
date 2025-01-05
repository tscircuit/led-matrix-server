import React, { useState } from "react"

const ROWS = 5
const COLS = 3

const COLORS = ["bg-gray-200", "bg-red-500", "bg-green-500", "bg-blue-500"]

function App() {
  const [matrix, setMatrix] = useState(Array(ROWS * COLS).fill(0))

  const handleClick = (index: number) => {
    const newMatrix = [...matrix]
    newMatrix[index] = (newMatrix[index] + 1) % COLORS.length
    setMatrix(newMatrix)

    // Convert 1D array to 2D array for API
    const matrix2D = Array(ROWS)
      .fill(0)
      .map((_, row) =>
        Array(COLS)
          .fill(0)
          .map((_, col) => newMatrix[row * COLS + col]),
      )

    // Send updated matrix to API
    fetch("/api/matrix/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(matrix2D),
    }).catch(console.error)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">
          LED Matrix Controller
        </h1>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {matrix.map((color, index) => (
            <button
              type="button"
              key={index}
              onClick={() => handleClick(index)}
              className={`h-16 w-16 rounded-lg ${COLORS[color]} transition-colors duration-200`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
