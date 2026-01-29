'use client';
import React from 'react';
import { cn } from '@/lib/utils';

type MenuToggleProps = React.ComponentProps<'svg'> & {
	open: boolean;
	duration?: number;
};

export function MenuToggleIcon({
	open,
	className,
	fill = 'none',
	stroke = 'currentColor',
	strokeWidth = 2.5,
	strokeLinecap = 'round',
	strokeLinejoin = 'round',
	duration = 500,
	...props
}: MenuToggleProps) {
	return (
		<svg
			strokeWidth={strokeWidth}
			fill={fill}
			stroke={stroke}
			viewBox="0 0 32 32"
			strokeLinecap={strokeLinecap}
			strokeLinejoin={strokeLinejoin}
			className={cn(
				'transition-transform ease-in-out',
				open && '-rotate-45',
				className,
			)}
			style={{
				transitionDuration: `${duration}ms`,
			}}
			{...props}
		>
			<path
				className={cn(
					'transition-all ease-in-out',
					open
						? '[stroke-dasharray:20_300] [stroke-dashoffset:-32.42px]'
						: '[stroke-dasharray:12_63]',
				)}
				style={{
					transitionDuration: `${duration}ms`,
				}}
				d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
			/>
			<path d="M7 16 27 16" />
		</svg>
	);
}
