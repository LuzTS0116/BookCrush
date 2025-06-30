import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface ShareAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  downloadedImageUrl: string | null;
  loading: boolean;
  shareDialogCallback: () => void;
}

export function ShareAchievementDialog({
  open,
  onOpenChange,
  downloadedImageUrl,
  loading,
  shareDialogCallback
}: ShareAchievementDialogProps) {

  function handleCallback(){
    shareDialogCallback();
    onOpenChange(false);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[85vw] rounded-2xl px-0 py-1 text-secondary">
        <Image
          src="/images/background.png"
          alt="Share achievement background"
          width={1622}
          height={2871}
          className="absolute inset-0 w-full h-full object-cover rounded-2xl z-[-1]"
        />
        {!downloadedImageUrl ? (
          <div className="text-center p-6">
            <p className="text-sm text-bookWhite">Oops! Something went wrong while generating your image. Try again.</p>
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-4">
              <DialogTitle className="mt-0 text-center text-base font-medium text-bookWhite">
                Your review has been submitted!🎉
              </DialogTitle>
              <DialogDescription className="text-center text-[12px] mt-2 text-bookWhite/80 font-serif leading-[13px]">
                Want to share your achievement with your friends? Download this image and share it on your favorite platform!
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2 py-0 px-4">
              <div className="h-[40vh] w-auto overflow-hidden mx-auto rounded-lg shadow-md">
                <img
                  src={downloadedImageUrl}
                  alt="Book achievement preview"
                  className="h-full w-auto object-contain mx-auto"
                />
              </div>

              <div className="flex flex-row justify-center mt-4 gap-3">
                <div className="">
                  <a
                    href={downloadedImageUrl}
                    download="reading-achievement.png"
                    className="bg-primary text-secondary px-4 py-2 rounded-full text-sm hover:bg-primary-dark transition"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Download Image</>
                    )}
                  </a>
                </div>
                <div className="">
                  <a
                    //onClick={() => onOpenChange(false)}
                    onClick={handleCallback}
                    download="reading-achievement.png"
                    className="bg-accent/80 text-secondary px-4 py-2 rounded-full text-sm hover:bg-accent transition"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Close</>
                    )}
                  </a>
                </div>
              </div>
            </div>

            <DialogFooter />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}