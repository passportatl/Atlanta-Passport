import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { MapPin, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { events } from "@/data/sample-data";
import eventWatchPartyImg from "@/assets/images/event-watch-party.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function Events() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-primary mb-6">
              Atlanta during the World Cup
            </h1>
            <p className="text-xl text-muted-foreground">
              From epic watch parties to local pop-ups, discover the best events happening around the city during the tournament.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <p className="text-lg text-muted-foreground mb-8 font-medium">
            Upcoming featured events
          </p>
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {events.map((event) => (
              <motion.div key={event.id} variants={fadeInUp}>
                <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 border-border group">
                  <div className="aspect-video overflow-hidden relative">
                    <img 
                      src={eventWatchPartyImg} 
                      alt={event.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-background/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-primary">
                      {event.category}
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl font-serif mb-2">{event.name}</CardTitle>
                    <CardDescription className="space-y-2">
                      <span className="flex items-center text-foreground/80">
                        <Calendar className="w-4 h-4 mr-2 text-primary" /> {event.date}
                      </span>
                      <span className="flex items-center text-foreground/80">
                        <MapPin className="w-4 h-4 mr-2 text-primary" /> {event.venue}, {event.neighborhood}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground line-clamp-3">{event.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5">
                      View Event
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}