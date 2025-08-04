interface StepIndicatorProps {
  stepNumber: number
  children: React.ReactNode
}

export function StepIndicator({ stepNumber, children }: StepIndicatorProps) {
  return (
    <div className="flex gap-2 mt-10 w-full max-md:flex-wrap max-md:max-w-full">
      <div className="flex justify-center items-center p-2.5 my-auto w-6 h-6 text-sm font-semibold tracking-normal text-center text-white whitespace-nowrap bg-blue-600 rounded-[100px] leading-[3px]">
        {stepNumber}
      </div>
      <div className="text-base text-left tracking-normal leading-5 text-neutral-800 text-opacity-70 max-md:max-w-full">
        {children}
      </div>
    </div>
  )
}