import type { HTMLAttributes } from 'react'

type ContainerSize = 'sm' | 'md' | 'lg'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize
}

const SIZE_CLASSES: Record<ContainerSize, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-6xl',
}

export function Container({ size = 'lg', className = '', ...props }: ContainerProps) {
  return (
    <div className={`mx-auto w-full px-4 ${SIZE_CLASSES[size]} ${className}`} {...props} />
  )
}
