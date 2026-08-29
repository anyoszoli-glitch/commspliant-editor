type HeadingBlockProps = {
  text: string
}

export function HeadingBlock({ text }: HeadingBlockProps) {
  return (
    <h1
      style={{
        fontSize: '28px',
        fontWeight: 700,
        lineHeight: 1.2,
        margin: '0 0 20px 0',
      }}
    >
      {text}
    </h1>
  )
}