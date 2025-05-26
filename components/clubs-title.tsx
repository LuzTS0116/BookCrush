"use client"

export default function ClubsTitle() {
  return (
    <div className="container mx-auto pt-8 pb-6 px-4 mt-[-10px] bg-secondary-light rounded-b-3xl">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-bookWhite">Book Clubs<span className="text-2xl"> 🌻</span></h1>
            <p className="text-bookWhite font-serif text-base/5">
              Join a circle of friends who love the stories you do. Where book lovers come together to share and discover.
            </p>
          </div>
        </div>  
      </div>
    </div>
  );
}