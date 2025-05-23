import React, { useRef, useState } from "react";
import { ContentSectionProps } from "../types/DisplayTypes";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
  dietaryRestrictions: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ContentRSVP: React.FC<ContentSectionProps> = ({ isActive, onClick }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      attending: "yes", // Default to 'yes' since we're removing the option
      guestCount: 1,
      dietaryRestrictions: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      
      const result = await saveRSVP({
        name: data.name,
        attending: data.attending as 'yes' | 'no' | 'maybe',
        guestCount: data.guestCount,
        dietaryRestrictions: data.dietaryRestrictions,
      });

      if (result.success) {
        setSubmitted(true);
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
  };
  
  return (
    <div
      className={`rsvp-content colortransition ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={handleClick}
    >
      <div className="content-header py-0">Anmeldung</div>
      
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
                className="text-green-500 mb-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h3 className="font-medium text-lg">Vielen Dank!</h3>
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
                  
                  {/* Hidden field for attending */}
                  <FormField
                    control={form.control}
                    name="attending"
                    render={({ field }) => (
                      <input type="hidden" {...field} />
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="guestCount"
                      render={({ field }) => (
                        <FormItem className="">
                          <FormLabel className="text-sm">Gäste</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.valueAsNumber)
                              }
                              className="bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dietaryRestrictions"
                      render={({ field }) => (
                        <FormItem className="">
                          <FormLabel className="text-sm">Ernährungsbedürfnisse</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Einschränkungen?"
                              {...field}
                              className="bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? "Wird gesendet..." : "Anmeldung absenden"}
                  </Button>
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
