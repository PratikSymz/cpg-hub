// FeedbackForm.jsx
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Label } from "@/components/ui/label.jsx";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { getEdgeFunctionUrl } from "@/utils/supabase.js";
import { useNavigate } from "react-router-dom";
import { Send, MessageSquare } from "lucide-react";

const FeedbackForm = () => {
  const { user, isSignedIn, isLoaded } = useUser();
  const [name, setName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(
    user?.primaryEmailAddress?.emailAddress || ""
  );
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && user) {
      setName(user.fullName || "");
      setEmail(user.primaryEmailAddress?.emailAddress || "");
    }
  }, [isLoaded, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill out all fields.");
      return;
    }

    setSending(true);

    try {
      const res = await fetch(
        getEdgeFunctionUrl("send-feedback-email"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, message }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Feedback email failed:", text);
        throw new Error("Failed to send feedback email");
      }

      toast.success("Feedback sent! Thanks!");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      toast.error("Could not send feedback.");
      console.error(err);
    } finally {
      setSending(false);
      navigate("/", { replace: true });
    }
  };

  return (
    <main className="py-10">
      {/* Header Section */}
      <section className="w-5/6 mx-auto mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-cpg-teal/10 rounded-xl p-3">
            <MessageSquare className="h-6 w-6 text-cpg-teal" />
          </div>
        </div>
        <h1 className="gradient-title font-extrabold text-3xl sm:text-4xl text-center">
          Share Your Feedback
        </h1>
        <p className="text-center text-muted-foreground mt-3 max-w-lg mx-auto">
          Help us improve CPG Hub! We'd love to hear your thoughts, suggestions,
          or any issues you've encountered.
        </p>
      </section>

      {/* Form Card */}
      <section className="w-5/6 max-w-xl mx-auto">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Name
                </Label>
                <Input
                  type="text"
                  value={name}
                  readOnly
                  disabled
                  className="h-12 rounded-xl bg-gray-50 border-gray-200"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Email
                </Label>
                <Input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="h-12 rounded-xl bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Message
              </Label>
              <Textarea
                placeholder="Share your thoughts, suggestions, or report an issue..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="resize-y rounded-xl border-gray-200 focus:border-cpg-teal focus:ring-cpg-teal/20"
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={sending}
              className="w-full bg-cpg-brown hover:bg-cpg-brown/90 h-14 text-base rounded-xl mt-2"
              data-umami-event="Feedback Submission"
            >
              <Send className="h-5 w-5 mr-2" />
              {sending ? "Sending..." : "Send Feedback"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default FeedbackForm;
