import { useParams, Link } from "wouter";
import { businesses } from "@/data/sample-data";
import { MapPin, Gift, Sparkles, Clock, Navigation, ArrowLeft, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Listing() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const business = businesses.find(b => b.id === id);

  if (!business) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 bg-muted/20">
        <div className="card-pop bg-card max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">Business not found</h2>
          <p className="text-muted-foreground mb-8">We couldn't find the listing you're looking for.</p>
          <Link href="/explore" className="button-pop inline-flex items-center justify-center gap-2 w-full">
            <ArrowLeft className="w-4 h-4" /> Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    toast({
      title: "Saved to Passport!",
      description: `${business.name} has been added to your digital passport.`,
      duration: 3000,
    });
  };

  return (
    <div className="w-full pb-24 bg-background">
      {/* Hero Image */}
      <div className="w-full h-[40vh] md:h-[50vh] relative">
        <img 
          src={business.image} 
          alt={business.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-6 left-6 flex gap-2">
          <div className="badge-sticker bg-brand-yellow text-brand-yellow-foreground -rotate-2">
            {business.category}
          </div>
        </div>
        {business.sponsorTier && (
          <div className="absolute top-6 right-6 md:top-10 md:right-10 drop-shadow-[0_4px_0_rgba(0,0,0,0.85)]">
            <div className="passport-stamp bg-white text-brand-red ring-4 ring-foreground/10">
              <div>
                <Sparkles className="w-4 h-4 mx-auto mb-1" />
                Founding<br />Sponsor<br />· ATL ·
              </div>
            </div>
          </div>
        )}

        {/* Hero Title Content (Desktop) */}
        <div className="absolute bottom-8 left-6 md:left-12 lg:left-24 text-white hidden md:block">
          <h1 className="text-5xl lg:text-7xl font-serif font-bold mb-3">{business.name}</h1>
          <div className="flex items-center text-white/90 text-lg">
            <MapPin className="w-5 h-5 mr-2" /> {business.neighborhood}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-12 lg:px-24 -mt-6 md:mt-12 relative z-10">
        {/* Hero Title Content (Mobile) */}
        <div className="bg-card rounded-xl p-6 shadow-xl mb-8 md:hidden border border-border">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">{business.name}</h1>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="w-4 h-4 mr-1" /> {business.neighborhood}
          </div>
        </div>

        {/* Intro Description */}
        <p className="text-xl md:text-2xl text-foreground/90 font-medium leading-relaxed mb-10 max-w-3xl">
          {business.description}
        </p>

        {/* Offer Box */}
        {business.offer && (
          <div className="bg-accent/10 border-2 border-accent/30 rounded-2xl p-6 md:p-8 mb-12 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Gift className="w-32 h-32 text-accent" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center mb-3">
                <div className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center mr-3 shadow-md">
                  <Gift className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-accent-foreground/90 tracking-wide uppercase text-sm">Passport Offer</h3>
              </div>
              <p className="text-xl md:text-2xl font-serif text-foreground font-semibold">
                {business.offer}
              </p>
            </div>
          </div>
        )}

        {/* Main Details Grid */}
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          
          {/* Left Column - Details */}
          <div className="lg:col-span-3 space-y-10">
            <section>
              <h2 className="text-2xl font-serif font-bold text-primary mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {business.about}
              </p>
            </section>

            <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-border">
              <div>
                <div className="flex items-center text-primary font-bold mb-2">
                  <Clock className="w-5 h-5 mr-2" /> Hours
                </div>
                <p className="text-muted-foreground whitespace-pre-line">
                  {business.hours}
                </p>
              </div>
              <div>
                <div className="flex items-center text-primary font-bold mb-2">
                  <MapPin className="w-5 h-5 mr-2" /> Address
                </div>
                <p className="text-muted-foreground">
                  {business.address}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 pt-6">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address + ', Atlanta, GA')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button-pop flex-1 inline-flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" /> Get Directions
              </a>
              <button
                type="button"
                onClick={handleSave}
                className="button-pop button-pop-yellow flex-1 inline-flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" /> Save to Passport
              </button>
            </div>
          </div>

          {/* Right Column - Map & QR */}
          <div className="lg:col-span-2 space-y-8">
            <div className="card-pop bg-card overflow-hidden">
              <div className="h-48 bg-brand-sky relative flex items-center justify-center border-b-[3px] border-foreground">
                <div className="absolute inset-0 dot-grid opacity-30" />
                <div className="badge-sticker bg-brand-red text-white absolute top-3 left-3 -rotate-3 text-[10px]">
                  ★ ATL
                </div>
                <MapPin className="w-12 h-12 text-foreground relative z-10 drop-shadow-[2px_2px_0_rgba(255,255,255,0.6)]" />
              </div>
              <div className="p-5">
                <h4 className="font-display text-xs tracking-[0.18em] text-foreground mb-1">MAP PREVIEW</h4>
                <p className="text-sm font-medium text-foreground mb-3">{business.address}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address + ', Atlanta, GA')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display text-xs tracking-[0.16em] text-brand-red hover:underline inline-block"
                >
                  OPEN IN MAPS →
                </a>
              </div>
            </div>

            <div className="card-pop bg-brand-yellow text-brand-yellow-foreground text-center p-8 rotate-1 hover:rotate-0 transition-transform">
              <div className="badge-sticker bg-foreground text-brand-yellow inline-block mb-6 -rotate-2">
                ★ PASSPORT STAMP
              </div>
              <div className="w-44 h-44 mx-auto bg-white border-[3px] border-foreground shadow-pop p-2 flex flex-col">
                <div className="w-full h-full border-4 border-foreground relative overflow-hidden bg-white">
                  <div className="absolute top-2 left-2 w-8 h-8 border-4 border-foreground" />
                  <div className="absolute top-2 right-2 w-8 h-8 border-4 border-foreground" />
                  <div className="absolute bottom-2 left-2 w-8 h-8 border-4 border-foreground" />
                  <div className="absolute top-12 left-12 w-16 h-16 bg-foreground/20" />
                  <div className="absolute bottom-12 right-6 w-10 h-20 bg-foreground/40" />
                  <div className="absolute top-8 right-16 w-8 h-8 bg-foreground" />
                  <div className="absolute bottom-8 left-16 w-12 h-4 bg-foreground/80" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-red text-white px-2 py-1 text-[10px] font-display tracking-wider border-2 border-foreground">
                    SCAN
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium mt-6 leading-snug">
                Scan at the spot to unlock your stamp and claim rewards.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Nav */}
        <div className="mt-20 pt-8 border-t border-border flex justify-center">
          <Link href="/explore" className="font-display text-xs tracking-[0.18em] text-muted-foreground hover:text-brand-red transition-colors">
            EXPLORE MORE LOCAL BUSINESSES →
          </Link>
        </div>
      </div>
    </div>
  );
}