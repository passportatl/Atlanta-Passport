import { useParams, Link } from "wouter";
import { businesses } from "@/data/sample-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Gift, Sparkles, Clock, Navigation, ArrowLeft, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Listing() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const business = businesses.find(b => b.id === id);

  if (!business) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 bg-muted/20">
        <Card className="max-w-md w-full p-8 text-center border-border shadow-md">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">Business not found</h2>
          <p className="text-muted-foreground mb-8">We couldn't find the listing you're looking for.</p>
          <Link href="/explore">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Explore
            </Button>
          </Link>
        </Card>
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
          <div className="bg-background/95 backdrop-blur px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-primary shadow-lg">
            {business.category}
          </div>
        </div>
        {business.sponsorTier && (
          <div className="absolute top-6 right-6">
            <div className="bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center">
              <Sparkles className="w-3 h-3 mr-1" />
              {business.sponsorTier}
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

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address + ', Atlanta, GA')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-lg">
                  <Navigation className="w-5 h-5 mr-2" /> Get Directions
                </Button>
              </a>
              <Button 
                variant="outline" 
                className="flex-1 border-primary/20 text-primary hover:bg-primary/5 h-14 text-lg"
                onClick={handleSave}
              >
                <BookOpen className="w-5 h-5 mr-2" /> Save to Passport
              </Button>
            </div>
          </div>

          {/* Right Column - Map & QR */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-border shadow-md">
              <div className="h-48 bg-muted relative flex items-center justify-center">
                {/* Subtle grid pattern for map placeholder */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <MapPin className="w-10 h-10 text-primary absolute z-10" />
              </div>
              <CardContent className="p-4 bg-card">
                <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-1">Map Preview</h4>
                <p className="text-sm font-medium">{business.address}</p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address + ', Atlanta, GA')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary text-sm font-medium hover:underline mt-2 inline-block"
                >
                  Open in Maps
                </a>
              </CardContent>
            </Card>

            <Card className="border-border shadow-md text-center p-8 bg-card">
              <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-6">Passport Stamp QR</h4>
              <div className="w-48 h-48 mx-auto bg-white p-2 rounded-xl shadow-inner border border-muted flex flex-col">
                {/* CSS QR pattern placeholder */}
                <div className="w-full h-full border-4 border-primary rounded-lg relative overflow-hidden bg-white">
                  <div className="absolute top-2 left-2 w-8 h-8 border-4 border-primary" />
                  <div className="absolute top-2 right-2 w-8 h-8 border-4 border-primary" />
                  <div className="absolute bottom-2 left-2 w-8 h-8 border-4 border-primary" />
                  <div className="absolute top-12 left-12 w-16 h-16 bg-primary/20" />
                  <div className="absolute bottom-12 right-6 w-10 h-20 bg-primary/40" />
                  <div className="absolute top-8 right-16 w-8 h-8 bg-primary" />
                  <div className="absolute bottom-8 left-16 w-12 h-4 bg-primary/80" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-1 text-[10px] font-bold text-primary border border-primary">
                    SCAN
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                Scan at the location to unlock your stamp and claim rewards.
              </p>
            </Card>
          </div>

        </div>

        {/* Bottom Nav */}
        <div className="mt-20 pt-8 border-t border-border flex justify-center">
          <Link href="/explore">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary">
              Explore more local businesses →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}