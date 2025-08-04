// FeedbackForm.jsx
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Label } from "@/components/ui/label.jsx";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const FeedbackForm = () => {
  const { user, isLoaded } = useUser();
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
    setSending(true);

    try {
      const res = await fetch(
        "https://yddcboiyncaqmciytwjx.supabase.co/functions/v1/send-feedback-email",
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
    <div className="max-w-xl mx-auto p-10 space-y-8">
      <h1 className="text-4xl font-bold text-center">Feedback</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="mb-1 block">Name</Label>
            <Input
              className="input-class"
              type="text"
              value={name}
              readOnly
              disabled
            />
          </div>

          <div>
            <Label className="mb-1 block">Email</Label>
            <Input
              className="input-class"
              type="email"
              value={email}
              readOnly
              disabled
            />
          </div>
        </div>

        <div>
          <Label className="mb-1 block">Message</Label>
          <Textarea
            className="textarea-class resize-y block w-full h-24"
            placeholder="Your message..."
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          variant="default"
          size="lg"
          disabled={sending || !message.trim() || !email.trim() || !name.trim()}
          className="w-full bg-cpg-brown hover:bg-cpg-brown/90"
          data-umami-event="Feedback Submission"
        >
          {sending ? "Sending..." : "Submit"}
        </Button>
      </form>
    </div>
  );
};

export default FeedbackForm;
