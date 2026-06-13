function Bone({ className }: { className: string }) {
  return <div className={`bg-[#f0f2f4] animate-pulse rounded-lg ${className}`} />;
}

export function MeetupCardSkeleton() {
  return (
    <div className="w-full px-5 pt-5 pb-3 bg-white rounded-[16px] flex flex-col gap-3">
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-start justify-between gap-2">
          <Bone className="h-5 flex-1 rounded-md" />
          <Bone className="h-3 w-12 rounded-md mt-1" />
        </div>
        <div className="flex flex-col gap-[6px]">
          <div className="flex items-center gap-[6px]">
            <Bone className="w-[18px] h-[18px] rounded-full shrink-0" />
            <Bone className="h-3.5 w-28 rounded-md" />
          </div>
          <div className="flex items-center gap-[6px]">
            <Bone className="w-[18px] h-[18px] rounded-full shrink-0" />
            <Bone className="h-3.5 w-36 rounded-md" />
          </div>
          <div className="flex items-center gap-[6px]">
            <Bone className="w-[18px] h-[18px] rounded-full shrink-0" />
            <Bone className="h-3.5 w-20 rounded-md" />
          </div>
        </div>
      </div>
      <div className="w-full border-t border-[#f3f4f6]" />
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-[10px]">
          <Bone className="h-3 w-8 rounded-md" />
          <Bone className="h-3 w-8 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Bone className="w-5 h-5 rounded-full" />
          <Bone className="h-3 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function BoardPostSkeleton() {
  return (
    <div className="bg-white rounded-[16px] px-5 py-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <Bone className="h-5 w-16 rounded-full" />
        <Bone className="h-3 w-10 rounded-md" />
      </div>
      <Bone className="h-5 w-3/4 rounded-md" />
      <Bone className="h-3.5 w-full rounded-md" />
      <Bone className="h-3.5 w-2/3 rounded-md" />
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Bone className="w-5 h-5 rounded-full" />
          <Bone className="h-3 w-16 rounded-md" />
        </div>
        <div className="flex gap-3">
          <Bone className="h-3 w-8 rounded-md" />
          <Bone className="h-3 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-[16px] p-6 flex flex-col gap-4">
      <Bone className="w-20 h-20 rounded-[20px]" />
      <div className="flex flex-col gap-2 flex-1">
        <Bone className="h-4 w-3/4 rounded-md" />
        <Bone className="h-3.5 w-full rounded-md" />
        <Bone className="h-3.5 w-2/3 rounded-md" />
      </div>
      <div className="flex items-center justify-between">
        <Bone className="h-5 w-14 rounded-full" />
        <div className="flex gap-2">
          <Bone className="h-4 w-8 rounded-md" />
          <Bone className="h-4 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-6 px-4">
      <div className="bg-white rounded-[16px] p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <Bone className="h-6 w-2/3 rounded-md" />
          <div className="flex gap-2">
            <Bone className="w-9 h-9 rounded-[12px]" />
            <Bone className="w-9 h-9 rounded-[12px]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Bone className="w-6 h-6 rounded-full" />
          <Bone className="h-3.5 w-20 rounded-md" />
          <Bone className="h-3.5 w-16 rounded-md" />
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <Bone className="h-3.5 w-full rounded-md" />
          <Bone className="h-3.5 w-full rounded-md" />
          <Bone className="h-3.5 w-3/4 rounded-md" />
        </div>
        <div className="bg-[#f4f6fa] rounded-[8px] p-4 flex flex-col gap-3">
          <Bone className="h-3.5 w-24 rounded-md" />
          <Bone className="h-3.5 w-40 rounded-md" />
          <Bone className="h-3.5 w-32 rounded-md" />
        </div>
      </div>
      <Bone className="h-[52px] w-full rounded-[12px]" />
      <div className="bg-white rounded-[16px] p-5 flex flex-col gap-4">
        <Bone className="h-4 w-16 rounded-md" />
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Bone className="w-7 h-7 rounded-full shrink-0" />
              <div className="flex flex-col gap-1.5 flex-1">
                <Bone className="h-3.5 w-20 rounded-md" />
                <Bone className="h-3.5 w-full rounded-md" />
                <Bone className="h-3.5 w-2/3 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
