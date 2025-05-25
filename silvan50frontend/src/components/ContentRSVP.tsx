import React, { useRef, useState, useEffect } from "react";
import { ContentSectionProps } from "../types/DisplayTypes";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveRSVP } from "../utils/airtable";

// Define form schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name muss mindestens 2 Zeichen lang sein" }),
  attending: z.enum(["yes", "no", "maybe"]),
  guestCount: z.coerce.number().min(1).max(10),
  comment: z.string().optional(),
});

// Schema for page 1 validation
const page1Schema = z.object({
  name: z.string().min(2, { message: "Name muss mindestens 2 Zeichen lang sein" }),
  attending: z.enum(["yes", "no", "maybe"]),
  guestCount: z.coerce.number().min(1).max(10),
});

type FormValues = z.infer<typeof formSchema>;

const ContentRSVP: React.FC<ContentSectionProps> = ({ isActive, onClick }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      attending: "yes",
      guestCount: 1,
      comment: "",
    },
  });

  // Handle page navigation
  const handleNextPage = async () => {
    // Validate page 1 fields only
    const page1Data = {
      name: form.getValues('name'),
      attending: form.getValues('attending'),
      guestCount: form.getValues('guestCount'),
    };

    const result = page1Schema.safeParse(page1Data);
    if (!result.success) {
      // Trigger validation errors on the form
      await form.trigger(['name', 'attending', 'guestCount']);
      return;
    }

    setCurrentPage(2);
  };

  const handlePrevPage = () => {
    setCurrentPage(1);
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      const result = await saveRSVP({
        name: data.name,
        attending: data.attending as 'yes' | 'no' | 'maybe',
        guestCount: data.guestCount,
        comment: data.comment,
      });

      if (result.success) {
        setSubmitted(true);
        setCurrentPage(1); // Reset to page 1
        form.reset();
      } else {
        setSubmitError(result.error || "Anmeldung konnte nicht übermittelt werden. Bitte versuche es erneut.");
      }
    } catch (error) {
      setSubmitError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger the onClick when interacting with the form
    if ((e.target as HTMLElement).closest('form')) {
      e.stopPropagation();
      return;
    }
    
    if (onClick) onClick();
  };
  
  // Reset form to try again
  const handleReset = () => {
    setSubmitted(false);
    setSubmitError(null);
    setCurrentPage(1);
  };
  
  return (
    <div
      className={`rsvp-content colortransition ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={handleClick}
    >
      <div className={`content-header py-0 ${onClick ? 'cursor-pointer' : ''}`}>Anmeldung</div>
      
      <div
        ref={contentRef}
        className={`content-body ${!isActive ? "collapsed" : ""}`}
        style={{
          maxHeight: isActive ? "100dvh" : "0", // Use a very large value when active
        }}
      >
        <div className="py-2">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="48" 
                height="48" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className=" mb-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h3 className="text-sm">Vielen Dank!</h3>
              <p className="text-sm opacity-80 mb-4">Deine Anmeldung wurde erfolgreich übermittelt.</p>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Weitere Antwort senden
              </Button>
            </div>
          ) : (
            <>
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-2">
                  <p className="text-red-700 text-sm">{submitError}</p>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                  {/* Page 1 fields - always shown on large screens, shown on page 1 for small screens */}
                  {(!isSmallScreen || currentPage === 1) && (
                    <>
                      <FormLabel className="text-sm hidden md:block">Name</FormLabel>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <Input placeholder="Dein Name" {...field} className="bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Attending field with radio buttons */}
                      <FormField
                        control={form.control}
                        name="attending"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <div className="flex items-center space-x-4">
                                <FormLabel className="text-sm font-medium">Teilnahme</FormLabel>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex flex-row space-x-4"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="yes" id="yes" />
                                    <label htmlFor="yes" className="text-sm font-medium">Ja</label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="no" id="no" />
                                    <label htmlFor="no" className="text-sm font-medium">Nein</label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="maybe" id="maybe" />
                                    <label htmlFor="maybe" className="text-sm font-medium">Vielleicht</label>
                                  </div>
                                </RadioGroup>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Guest count field - inline */}
                      <FormField
                        control={form.control}
                        name="guestCount"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormControl>
                              <div className="flex items-center space-x-4">
                                <FormLabel className="text-sm font-medium">Gäste</FormLabel>
                                <Input
                                  type="number"
                                  min={1}
                                  max={10}
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.valueAsNumber)
                                  }
                                  className="bg-white flex-1"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  {/* Page 2 fields - always shown on large screens, shown on page 2 for small screens */}
                  {(!isSmallScreen || currentPage === 2) && (
                    <>
                      {/* Comment field */}
                      <FormField
                        control={form.control}
                        name="comment"
                        render={({ field }) => (
                          <FormItem className="space-y-1">
                            <FormLabel className="text-sm">Kommentar</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Hast du noch Fragen oder Anmerkungen?"
                                {...field}
                                className="bg-white min-h-[60px] resize-none"
                                rows={2}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  {/* Navigation and submit buttons */}
                  {isSmallScreen ? (
                    <>
                      {currentPage === 1 ? (
                        <Button 
                          type="button" 
                          className="w-full"
                          onClick={handleNextPage}
                        >
                          Weiter
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant="outline"
                            className="flex-1"
                            onClick={handlePrevPage}
                          >
                            Zurück
                          </Button>
                          <Button 
                            type="submit" 
                            className="flex-1"
                            disabled={submitting}
                          >
                            {submitting ? "Wird gesendet..." : "Anmeldung absenden"}
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? "Wird gesendet..." : "Anmeldung absenden"}
                    </Button>
                  )}
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentRSVP;
