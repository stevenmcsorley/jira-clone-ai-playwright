import type { CardProps } from './Card.types'

export const Card = ({ children, className, padding = true }: CardProps) => {
  const classes = [
    'card',
    padding ? 'p-6' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {children}
    </div>
  )
}