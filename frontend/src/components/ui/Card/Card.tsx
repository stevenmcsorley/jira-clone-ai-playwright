import type { CardProps } from './Card.types'

export const Card = ({
  children,
  className,
  padding = true,
  draggable,
  onDragStart,
  onClick,
  'data-testid': dataTestId,
}: CardProps) => {
  const classes = [
    'card',
    padding ? 'p-6' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div
      className={classes}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
      data-testid={dataTestId}
    >
      {children}
    </div>
  )
}