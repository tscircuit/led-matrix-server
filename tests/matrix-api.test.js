import { test } from "bun:test"
import assert from "node:assert/strict"
import { EventEmitter } from "node:events"
import { matrixApiPlugin } from "../vite.config.ts"

const validMatrix = [
  [0, 1, 2],
  [3, 0, 1],
  [2, 3, 0],
  [1, 2, 3],
  [0, 1, 2],
]

function createRequest() {
  let middleware
  matrixApiPlugin().configureServer({
    middlewares: {
      use(handler) {
        middleware = handler
      },
    },
  })

  return (method, url, chunks = []) => {
    const req = Object.assign(new EventEmitter(), { method, url })
    const res = {
      statusCode: 200,
      body: "",
      ended: false,
      end(body) {
        this.body = body
        this.ended = true
      },
    }
    let nextCalled = false
    middleware(req, res, () => {
      nextCalled = true
    })
    for (const chunk of chunks) req.emit("data", Buffer.from(chunk))
    if (method === "POST") req.emit("end")
    return { ...res, nextCalled }
  }
}

function update(request, matrix) {
  return request("POST", "/api/matrix/update", [JSON.stringify(matrix)])
}

function read(request) {
  return JSON.parse(request("GET", "/api/matrix/get").body)
}

function withColor(color) {
  return validMatrix.map((row, rowIndex) =>
    row.map((value, colIndex) =>
      rowIndex === 2 && colIndex === 1 ? color : value,
    ),
  )
}

for (const [name, matrix] of [
  ["mixed colors", validMatrix],
  ["all off", Array.from({ length: 5 }, () => [0, 0, 0])],
  ["upper color boundary", Array.from({ length: 5 }, () => [3, 3, 3])],
]) {
  test(`accepts a valid matrix: ${name}`, () => {
    const request = createRequest()
    const response = update(request, matrix)
    assert.equal(response.statusCode, 200)
    assert.deepEqual(JSON.parse(response.body), { success: true })
    assert.deepEqual(read(request), matrix)
  })
}

test("accepts valid JSON delivered in multiple chunks", () => {
  const request = createRequest()
  const body = JSON.stringify(validMatrix)
  const response = request("POST", "/api/matrix/update", [
    body.slice(0, 8),
    body.slice(8, 21),
    body.slice(21),
  ])
  assert.equal(response.statusCode, 200)
  assert.deepEqual(read(request), validMatrix)
})

const invalidMatrices = [
  ["null", null],
  ["number", 42],
  ["string", "matrix"],
  ["boolean", true],
  ["object", {}],
  ["empty array", []],
  ["too few rows", validMatrix.slice(0, 4)],
  ["too many rows", [...validMatrix, [0, 1, 2]]],
  ["too few columns", validMatrix.map((row, i) => (i === 1 ? [0, 1] : row))],
  ["too many columns", validMatrix.map((row, i) => (i === 1 ? [0, 1, 2, 3] : row))],
  ["null row", validMatrix.map((row, i) => (i === 1 ? null : row))],
  ["object row", validMatrix.map((row, i) => (i === 1 ? { length: 3 } : row))],
  ["negative color", withColor(-1)],
  ["color above three", withColor(4)],
  ["fractional color", withColor(1.5)],
  ["numeric string color", withColor("1")],
  ["null color", withColor(null)],
  ["boolean color", withColor(true)],
]

for (const [name, matrix] of invalidMatrices) {
  test(`rejects ${name} and preserves the last valid matrix`, () => {
    const request = createRequest()
    update(request, validMatrix)
    const response = update(request, matrix)
    assert.deepEqual(
      {
        status: response.statusCode,
        body: JSON.parse(response.body),
        matrix: read(request),
      },
      {
        status: 400,
        body: { error: "Invalid matrix data" },
        matrix: validMatrix,
      },
    )
  })
}

test("malformed JSON still returns 400 without changing the matrix", () => {
  const request = createRequest()
  update(request, validMatrix)
  const response = request("POST", "/api/matrix/update", ["{"])
  assert.equal(response.statusCode, 400)
  assert.deepEqual(JSON.parse(response.body), { error: "Invalid matrix data" })
  assert.deepEqual(read(request), validMatrix)
})

test("a valid update still succeeds after an invalid update", () => {
  const request = createRequest()
  update(request, validMatrix)
  const rejected = update(request, withColor(4))
  assert.equal(rejected.statusCode, 400)
  const nextMatrix = Array.from({ length: 5 }, () => [3, 2, 1])
  assert.equal(update(request, nextMatrix).statusCode, 200)
  assert.deepEqual(read(request), nextMatrix)
})

test("unrelated paths and unsupported methods fall through without changing state", () => {
  const request = createRequest()
  update(request, validMatrix)
  for (const [method, url] of [
    ["GET", "/unrelated"],
    ["GET", "/api/matrix/update"],
    ["POST", "/api/matrix/get"],
  ]) {
    const response = request(method, url, ["null"])
    assert.equal(response.nextCalled, true)
    assert.equal(response.ended, false)
    assert.deepEqual(read(request), validMatrix)
  }
})
