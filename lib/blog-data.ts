export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
}

export const blogPosts: BlogPost[] = [
  {
    id: "how-to-send-bulk-emails",
    title: "How to Send Bulk Emails to Members",
    excerpt: "Learn how to efficiently communicate with your entire membership using UnionTab's powerful bulk email feature.",
    content: `
      <p>Effective communication is the backbone of any successful union. Whether you're rallying members for an upcoming vote, sharing bargaining updates, or distributing important documents, getting the right message to the right people matters. UnionTab's Mass Email feature lets you send branded emails to your entire membership — or targeted groups — in just a few clicks.</p>

      <p>In this step-by-step tutorial, we'll walk you through the entire process, from opening the Mass Email page to hitting send.</p>

      <h2>Step 1: Open the Mass Email Page</h2>

      <p>From anywhere in your union's dashboard, look at the top navigation bar and click the <strong>Tools</strong> button (the shield icon). This opens the mega-menu — a central hub for all of UnionTab's powerful features.</p>

      <p>Under the <strong>Communications</strong> group, click <strong>Mass Email</strong>.</p>

      <p>You'll land on the Emails page, which displays a Mail icon and the subtitle <em>"Send emails to multiple members at once."</em></p>

      <p>At the top of the page, you'll immediately see your <strong>Monthly Email Usage</strong> card. This shows a progress bar along with key stats: how many emails you've sent this month, your plan's monthly limit, how many remain, and when the counter resets. This is your at-a-glance check to make sure you have enough capacity for your send.</p>

      <div class="my-6 flex justify-center">
        <div class="rounded-lg overflow-hidden shadow-md border border-gray-200" style="max-width: 320px;">
          <img src="/assets/blog/how-to-send-bulk-emails/1.png" alt="The Tools mega-menu open, showing Mass Email highlighted under the Communications group" class="w-full" />
        </div>
      </div>

      <h2>Step 2: Select Your Recipients</h2>

      <p>The first card on the page is <strong>Select Recipients</strong>. Here you'll choose exactly who receives your email.</p>

      <p>Use the <strong>"Send to:"</strong> dropdown to pick from the following options:</p>

      <ul>
        <li><strong>All Members</strong> — every member in your local's database, regardless of status</li>
        <li><strong>Approved Members</strong> (default) — only members whose membership has been approved</li>
        <li><strong>Admins Only</strong> — your executive board and administrators</li>
        <li><strong>Pending Members</strong> — members awaiting approval</li>
        <li><strong>Rejected Members</strong> — members whose applications were declined</li>
        <li><strong>Custom Selection</strong> — hand-pick individual recipients</li>
      </ul>

      <p>Once you make your selection, a blue info box appears below the dropdown showing exactly how many recipients are selected — for example, <em>"24 recipients selected."</em></p>

      <p>If you choose <strong>Custom Selection</strong>, a searchable member table appears with checkboxes beside each member. Each row shows the member's avatar, name, email address, role, and status. You can use <strong>Select All</strong> or <strong>Deselect All</strong> to speed things up, search by name or email, and sort columns to find exactly who you need.</p>

      <div class="my-6 flex justify-center">
        <div class="rounded-lg overflow-hidden shadow-md border border-gray-200" style="max-width: 420px;">
          <img src="/assets/blog/how-to-send-bulk-emails/2.png" alt="The recipient selection dropdown showing all filter options, with the recipient count displayed below" class="w-full" />
        </div>
      </div>

      <h2>Step 3: Compose Your Email</h2>

      <p>Below the recipient card, you'll find the <strong>Compose Email</strong> card. This is where you craft your message.</p>

      <h3>Subject Line</h3>
      <p>Enter your email subject line in the <strong>Subject</strong> field. This is required — every email needs a clear subject so members know what it's about before they open it.</p>

      <h3>Message Body</h3>
      <p>Use the <strong>rich text editor</strong> to write and format your message. The toolbar gives you full control over formatting: bold, italic, headers, links, bulleted and numbered lists, and images. Write your message naturally — UnionTab automatically wraps it in your union's branded email template, complete with your logo and colours. No design work needed on your end.</p>

      <h3>File Attachments</h3>
      <p>Need to send a collective agreement, meeting minutes, or a flyer? Use the <strong>File Attachments</strong> area to attach up to <strong>10 files</strong>, each up to <strong>50MB</strong>. Simply drag and drop files into the upload area or click to browse your computer.</p>

      <div class="my-6 rounded-lg overflow-hidden shadow-md border border-gray-200">
        <img src="/assets/blog/how-to-send-bulk-emails/3.png" alt="The Compose Email card showing the subject field, rich text editor with formatting toolbar, and file attachment area" class="w-full" />
      </div>

      <h2>Step 4: Preview and Send</h2>

      <p>Before you send, take a moment to double-check everything.</p>

      <h3>Preview Your Recipients</h3>
      <p>Click the <strong>Preview Recipients</strong> button (eye icon) to open a dialog showing the complete list of people who will receive your email. Each recipient is displayed with their avatar, full name, email address, and role badge. Scan through the list to verify the right people are included.</p>

      <div class="my-6 flex justify-center">
        <div class="rounded-lg overflow-hidden shadow-md border border-gray-200" style="max-width: 500px;">
          <img src="/assets/blog/how-to-send-bulk-emails/4.png" alt="The Preview Recipients dialog showing the list of recipients with avatars and role badges" class="w-full" />
        </div>
      </div>

      <h3>Send Your Email</h3>
      <p>When you're satisfied, click the <strong>Send Email</strong> button (send icon). A confirmation dialog appears showing your subject line, the number of recipients, and a clear warning: <em>"This action cannot be undone."</em></p>

      <p>Click <strong>Send Email</strong> in the confirmation dialog to dispatch your message.</p>

      <p>After sending, a success alert confirms delivery — for example, <em>"Email sent successfully to 47 of 48 recipients!"</em> Your monthly usage counter updates automatically to reflect the send.</p>

      <h2>Best Practices for Union Mass Emails</h2>

      <ul>
        <li><strong>Keep subject lines clear and concise</strong> — members receive a lot of emails. A subject like "Ratification Vote: Thursday at 7 PM" is far more effective than "Important Update."</li>
        <li><strong>Use the "Approved Members" filter for most communications</strong> — this ensures you're reaching active, verified members of your local.</li>
        <li><strong>Attach important documents directly</strong> — rather than linking to external sites, attach contracts, agendas, or reports right to the email so members have them immediately.</li>
        <li><strong>Check your monthly email usage before large sends</strong> — glance at the usage card at the top of the page to make sure you have enough capacity, especially before sending to your full membership.</li>
        <li><strong>Let the branded template do the work</strong> — your message is automatically wrapped in a professional template featuring your union's logo and colours. Focus on the content, not the design.</li>
      </ul>

      <h2>Pro Tip: Automatic Email Sharing</h2>

      <p>Here's a workflow shortcut many union leaders love: when you create a new <strong>news post</strong> or schedule a <strong>meeting</strong> in UnionTab, the platform offers to share it with members via email automatically. It pre-fills the subject and content for you, so all you have to do is select your recipients and hit send. It's the fastest way to keep your membership informed.</p>
    `,
    imageUrl: "/assets/blog/how-to-send-bulk-emails/0.png",
    author: "UnionTab Team",
    publishedAt: "2025-12-15",
    readTime: "5 min read",
    tags: ["Tutorial", "Communication", "Email"]
  },
  {
    id: "uploading-files-and-creating-posts",
    title: "Sharing Files & Posts: Public vs Private",
    excerpt: "Understand the difference between public and private content in UnionTab and learn how to share documents and updates effectively.",
    content: `
      <p>UnionTab gives you complete control over who sees your content. Whether you're uploading important documents like collective agreements and meeting minutes, or publishing news updates to keep your membership informed, understanding the visibility settings is key to effective communication.</p>

      <p>This tutorial covers two essential workflows: uploading and organising files, and creating news posts — including how to control whether content is public or members-only.</p>

      <h2>Part 1: Uploading Files</h2>

      <h3>Accessing the File Manager</h3>

      <p>Click the <strong>Files</strong> tab in the top navigation bar (the folder icon). You'll see your files organised in a clean, intuitive layout: <strong>category folders</strong> on the left sidebar and a <strong>grid of file cards</strong> on the right.</p>

      <p>Admins can reorder categories using the up/down arrows and rename them using the pencil icon — keeping your file library tidy as it grows.</p>

      <div class="my-6 rounded-lg overflow-hidden shadow-md border border-gray-200">
        <img src="/assets/blog/uploading-files-and-creating-posts/1.png" alt="The Files tab showing category folders on the left sidebar and the file card grid on the right" class="w-full" />
      </div>

      <h3>Uploading a New File</h3>

      <p>Click the <strong>Upload File</strong> button to open the upload dialog. Here's what you'll see:</p>

      <ol>
        <li><strong>File upload area</strong> — drag and drop a file or click to browse your computer. Any file type is accepted, up to 50MB per file.</li>
        <li><strong>Display Name</strong> — optionally rename the file to something more descriptive. If you leave this blank, the original filename is used.</li>
        <li><strong>Category</strong> — type a category name such as "Bylaws," "Contracts," or "Meeting Minutes." As you type, existing categories are suggested so you can keep things consistent.</li>
        <li><strong>Private File toggle</strong> — enable this to restrict access so only approved members can view and download the file.</li>
      </ol>

      <p>Click <strong>Upload File</strong> to save. For PDF files, a thumbnail preview is automatically generated, making it easy for members to identify documents at a glance.</p>

      <div class="my-6 flex justify-center">
        <div class="rounded-lg overflow-hidden shadow-md border border-gray-200" style="max-width: 520px;">
          <img src="/assets/blog/uploading-files-and-creating-posts/2.png" alt="The Upload File dialog showing the file upload area, display name field, category input with suggestions, and the Private File toggle" class="w-full" />
        </div>
      </div>

      <h3>Managing Your Files</h3>

      <p>Once uploaded, each file appears as a card in the grid. Cards display the file icon (colour-coded by file type), filename, file size, and extension. Files marked as private show a <strong>"Private"</strong> badge so you can tell at a glance what's restricted.</p>

      <p>Hover over any file card to reveal the action menu:</p>

      <ul>
        <li><strong>Open</strong> — view the file in your browser</li>
        <li><strong>Download</strong> — save a copy to your computer</li>
        <li><strong>Edit</strong> — update the display name, category, or visibility (admins only)</li>
        <li><strong>Delete</strong> — remove the file permanently (admins only)</li>
      </ul>

      <p>Owners can also see a <strong>storage usage widget</strong> showing how much of your plan's storage has been used — helpful for keeping tabs on capacity.</p>

      <h3>Public vs. Private Files</h3>

      <p>Understanding the difference between public and private files is crucial for managing your union's information:</p>

      <p><strong>Public files</strong> are visible to anyone visiting your union's page, including non-members and the general public. These are ideal for:</p>
      <ul>
        <li>Bylaws and constitution</li>
        <li>Press releases</li>
        <li>Recruitment materials</li>
        <li>General information about your local</li>
      </ul>

      <p><strong>Private files</strong> are only visible to approved, logged-in members of your local. Use these for:</p>
      <ul>
        <li>Collective agreements and contracts</li>
        <li>Meeting minutes</li>
        <li>Financial reports and budgets</li>
        <li>Internal communications and strategy documents</li>
      </ul>

      <h2>Part 2: Publishing News Posts</h2>

      <h3>Accessing the News Feed</h3>

      <p>Click the <strong>News</strong> tab in the top navigation bar (the newspaper icon). This is the default landing tab for your union's page — it's the first thing visitors and members see, so keep it active with regular updates.</p>

      <div class="my-6 rounded-lg overflow-hidden shadow-md border border-gray-200">
        <img src="/assets/blog/uploading-files-and-creating-posts/3.png" alt="The News tab showing published posts with titles, content previews, and post images" class="w-full" />
      </div>

      <h3>Creating a New Post</h3>

      <p>Click the <strong>Create Post</strong> button (the + icon) to open the post creation dialog. Here's what to fill in:</p>

      <ol>
        <li><strong>Title</strong> — enter your post title. This is required and will appear as the headline. Make it clear and attention-grabbing.</li>
        <li><strong>Content</strong> — use the rich text editor to write and format your post. You have full formatting controls: bold, italic, headers, links, lists, and more. This field is required.</li>
        <li><strong>Post Image</strong> — optionally upload a featured image to accompany your post. Image files only, 10MB maximum, with a recommended size of 1200×800 pixels for the best display.</li>
        <li><strong>File Attachments</strong> — optionally attach up to 5 files of any type (50MB each). Perfect for attaching related documents, flyers, or forms.</li>
        <li><strong>Private Post toggle</strong> — enable this to make the post visible only to approved members.</li>
        <li><strong>Post Author</strong> — choose to publish as your <strong>Union Name</strong> (the default, for official communications) or <strong>Your Name</strong> (for personal messages from leadership). Use the two selector buttons to make your choice.</li>
      </ol>

      <p>Click <strong>Create Post</strong> to publish immediately.</p>

      <div class="my-6 flex justify-center">
        <div class="rounded-lg overflow-hidden shadow-md border border-gray-200" style="max-width: 580px;">
          <img src="/assets/blog/uploading-files-and-creating-posts/4.png" alt="The Create New Post dialog showing the title field, rich text editor, image upload, file attachments, private toggle, and author selector" class="w-full" />
        </div>
      </div>

      <h3>After Creating a Post</h3>

      <p>Once your post is published, a confirmation dialog appears: <em>"Post Created Successfully!"</em> Along with it, you'll see a helpful prompt: <em>"Would you like to share this post with members via email?"</em></p>

      <ul>
        <li>Click <strong>Yes, Share via Email</strong> to be taken directly to the Mass Email page with your post's content pre-filled as the email body. All you need to do is select your recipients and send.</li>
        <li>Click <strong>No, Thanks</strong> to dismiss the dialog and return to your news feed.</li>
      </ul>

      <p>This integration between posts and email is one of UnionTab's most powerful workflow shortcuts — publish once, distribute everywhere.</p>

      <div class="my-6 flex justify-center">
        <div class="rounded-lg overflow-hidden shadow-md border border-gray-200" style="max-width: 480px;">
          <img src="/assets/blog/uploading-files-and-creating-posts/5.png" alt="The post-creation success dialog asking whether to share the post via email" class="w-full" />
        </div>
      </div>

      <h3>Public vs. Private Posts</h3>

      <p><strong>Public posts</strong> are visible to everyone, including visitors who aren't members and search engines. This makes them excellent for:</p>
      <ul>
        <li>Public announcements and press releases</li>
        <li>Union victories and achievements</li>
        <li>Community events and outreach</li>
        <li>Industry updates and commentary</li>
      </ul>

      <p><strong>Private posts (Members Only)</strong> are visible only to approved, logged-in members. Use these for:</p>
      <ul>
        <li>Contract negotiation updates</li>
        <li>Internal strategy discussions</li>
        <li>Member-specific announcements</li>
        <li>Sensitive information that shouldn't be public</li>
      </ul>

      <h2>Quick Tips</h2>

      <ul>
        <li><strong>Pin important posts</strong> — use the pin icon on any post to keep it at the top of your news feed. Perfect for ongoing campaigns, election notices, or critical updates that members shouldn't miss.</li>
        <li><strong>Share posts via email</strong> — take advantage of the post-creation prompt to notify members instantly. Don't assume everyone checks the website regularly.</li>
        <li><strong>Use categories for files</strong> — organise documents into clear categories like "Contracts," "Meeting Minutes," and "Training Materials." It makes a huge difference as your file library grows.</li>
        <li><strong>When in doubt, start private</strong> — you can always change a file or post's visibility later. It's easier to make something public than to retract information that's already out there.</li>
      </ul>
    `,
    imageUrl: "/assets/blog/uploading-files-and-creating-posts/1.png",
    author: "UnionTab Team",
    publishedAt: "2025-11-28",
    readTime: "7 min read",
    tags: ["Tutorial", "Documents", "Posts", "Privacy"]
  },
  {
    id: "zoom-meetings-and-posters",
    title: "Schedule Zoom Meetings & Create Posters",
    excerpt: "Learn how to schedule virtual meetings, automatically generate promotional posters, and invite your members with just a few clicks.",
    content: `
      <p>Running a modern union often means coordinating members across different locations, shifts, and schedules. Whether your local spans multiple job sites, cities, or even provinces, getting everyone in the same room isn't always possible. UnionTab's Online Meetings feature lets you schedule video meetings, generate branded posters, and send invitations to members — all from one place.</p>

      <p><strong>Important:</strong> In UnionTab, <strong>Meetings</strong> and <strong>Events</strong> are separate features. Events are for general calendar items — in-person gatherings, socials, community activities, and the like. Meetings are specifically for <strong>online video conferences</strong> with Zoom, Google Meet, or custom meeting links. This tutorial covers the Meetings feature.</p>

      <h2>Step 1: Navigate to Online Meetings</h2>

      <p>From the top navigation bar, click the <strong>Tools</strong> button (the shield icon) to open the mega-menu. Under the <strong>Member Tools</strong> group, click <strong>Meetings</strong> (the video icon).</p>

      <p>You'll land on the Online Meetings page, which displays a Video icon and the subtitle <em>"View and join scheduled online meetings."</em></p>

      <p>The page is organised into tabs:</p>
      <ul>
        <li><strong>Upcoming</strong> — meetings that haven't happened yet</li>
        <li><strong>Past</strong> — meetings that have already taken place</li>
        <li><strong>Cancelled</strong> — meetings that were cancelled (this tab is visible to admins only)</li>
      </ul>

      <div class="my-6 flex justify-center">
        <div class="rounded-lg overflow-hidden shadow-md border border-gray-200" style="max-width: 320px;">
          <img src="/assets/blog/zoom-meetings-and-posters/1.png" alt="The Tools mega-menu open, showing Meetings highlighted under the Member Tools group" class="w-full" />
        </div>
      </div>

      <h2>Step 2: Schedule a New Meeting</h2>

      <p>Click the <strong>Create Meeting</strong> button (available to admins and owners only). The dialog title reads <em>"Schedule Online Meeting"</em> with the description <em>"Create a new online meeting and send invites to members."</em></p>

      <p>Fill in the following fields:</p>

      <ul>
        <li><strong>Meeting Title</strong> (required) — give your meeting a clear, descriptive name. For example: "Contract Ratification Discussion" or "Monthly Stewards' Meeting."</li>
        <li><strong>Description</strong> (optional) — add context about the purpose of the meeting.</li>
        <li><strong>Agenda</strong> (optional) — outline the topics to be covered. This will appear on the meeting poster, so members know what to expect.</li>
        <li><strong>Date</strong> (required) — select the meeting date.</li>
        <li><strong>Timezone</strong> — choose from Eastern, Central, Mountain, Pacific, Alaska, Hawaii, or UTC. This is especially important for locals with members in multiple time zones.</li>
        <li><strong>Start Time</strong> (required) and <strong>End Time</strong> (optional) — set when the meeting begins and, optionally, when it's expected to wrap up.</li>
      </ul>

      <h3>Choosing Your Platform</h3>

      <p>Under <strong>Platform</strong>, select one of three options:</p>
      <ul>
        <li><strong>Zoom</strong></li>
        <li><strong>Google Meet</strong></li>
        <li><strong>Other / Custom Link</strong></li>
      </ul>

      <p>If your union has configured the <strong>Zoom API integration</strong>, an <strong>"Auto-create Zoom meeting"</strong> toggle appears when you select Zoom. Enable it and UnionTab will automatically generate the Zoom meeting link, meeting ID, and password for you — no need to open Zoom separately.</p>

      <p>If you're not using auto-create (or you've chosen Google Meet or a custom link), you'll manually enter the <strong>Meeting Link</strong>, <strong>Meeting ID</strong>, and <strong>Meeting Password</strong>.</p>

      <h3>Visibility and Participants</h3>

      <ul>
        <li><strong>Members Only toggle</strong> (default: on) — when enabled, only approved members can view the meeting details and join link. Disable it if you want the meeting to be visible to all visitors.</li>
        <li><strong>Participant Selection</strong> — choose <strong>All members</strong> to invite everyone, or <strong>Selected members</strong> to hand-pick specific people using the member picker.</li>
      </ul>

      <p>Click <strong>Create Meeting</strong> to save and publish the meeting.</p>

      <div class="my-6 flex justify-center">
        <div class="rounded-lg overflow-hidden shadow-md border border-gray-200" style="max-width: 520px;">
          <img src="/assets/blog/zoom-meetings-and-posters/2.png" alt="The Schedule Online Meeting dialog showing all form fields including title, date/time, platform selector, and the auto-create Zoom toggle" class="w-full" />
        </div>
      </div>

      <h2>Step 3: Generate a Meeting Poster</h2>

      <p>One of UnionTab's most popular features is the automatic <strong>meeting poster generator</strong>. It creates a professional, branded poster for any meeting — ready to print, email, or share on social media.</p>

      <p>On any meeting card, open the action menu and click <strong>Download Poster</strong>. A poster dialog opens with a fully designed poster featuring:</p>

      <ul>
        <li><strong>Coloured header banner</strong> with your union's logo and name</li>
        <li><strong>Meeting title and description</strong> prominently displayed</li>
        <li><strong>Info grid</strong> showing the date, time (with timezone), and platform</li>
        <li><strong>"Join the Meeting" section</strong> with the meeting URL, Meeting ID, and password</li>
        <li><strong>Agenda section</strong> (if you provided an agenda when creating the meeting)</li>
        <li><strong>Union footer</strong> for a polished, professional finish</li>
      </ul>

      <p>At the bottom of the dialog, you'll find two action buttons:</p>
      <ul>
        <li><strong>Print / Save as PDF</strong> — opens your browser's print dialog, where you can print the poster directly or save it as a PDF file</li>
        <li><strong>Copy Meeting Link</strong> — copies the meeting URL to your clipboard for quick sharing</li>
      </ul>

      <p>Print the poster for bulletin boards in the workplace, save it as a PDF to attach to emails, or share the image on social media and messaging groups. The poster uses your union's theme colour and logo, so it looks professional and on-brand every time.</p>

      <div class="my-6 flex justify-center">
        <div class="rounded-lg overflow-hidden shadow-md border border-gray-200" style="max-width: 520px;">
          <img src="/assets/blog/zoom-meetings-and-posters/3.png" alt="The Meeting Poster dialog showing the branded poster with union logo, meeting details, join link, and the Print/Save as PDF button" class="w-full" />
        </div>
      </div>

      <h2>Step 4: Send Meeting Invitations</h2>

      <p>Once your meeting is scheduled, you'll want to make sure members know about it. UnionTab lets you send email invitations directly from the meeting card.</p>

      <p>Open the action menu on any meeting card and click <strong>Send Invites</strong>. The Send Invites dialog lets you select recipients using the <strong>"Send to:"</strong> dropdown:</p>

      <ul>
        <li><strong>All Members</strong></li>
        <li><strong>Approved Members</strong> (default)</li>
        <li><strong>Admins Only</strong></li>
        <li><strong>Pending Members</strong></li>
        <li><strong>Rejected Members</strong></li>
        <li><strong>Custom Selection</strong> — shows a searchable member table with checkboxes so you can pick specific people</li>
      </ul>

      <p>The dialog also shows how many invites have already been sent for this meeting. When you click <strong>Send Invites</strong>, new invitations are only dispatched to members who haven't received one yet — so you never have to worry about sending duplicate emails.</p>

      <p>Each invitation email includes the meeting details and a direct join link, making it easy for members to join when the time comes.</p>

      <div class="my-6 flex justify-center">
        <div class="rounded-lg overflow-hidden shadow-md border border-gray-200" style="max-width: 480px;">
          <img src="/assets/blog/zoom-meetings-and-posters/4.png" alt="The Send Invites dialog showing the recipient selection dropdown and the existing invite count" class="w-full" />
        </div>
      </div>

      <h2>Meeting Card Actions</h2>

      <p>For admins, each meeting card includes a dropdown menu with the full set of management actions:</p>

      <ul>
        <li><strong>Edit Meeting</strong> — update the title, description, time, link, or any other details</li>
        <li><strong>Send Invites</strong> — email meeting invitations to selected members</li>
        <li><strong>Download Poster</strong> — generate and download the branded meeting poster</li>
        <li><strong>Copy Meeting Link</strong> — copy the join URL to your clipboard</li>
        <li><strong>Delete</strong> — permanently remove the meeting</li>
      </ul>

      <p>Regular members see a simplified view with the meeting details and a join button — clean and straightforward.</p>

      <div class="my-6 flex justify-center">
        <div class="rounded-lg overflow-hidden shadow-md border border-gray-200" style="max-width: 480px;">
          <img src="/assets/blog/zoom-meetings-and-posters/5.png" alt="A meeting card showing the admin dropdown menu with all available actions" class="w-full" />
        </div>
      </div>

      <h2>Pro Tips for Better Meetings</h2>

      <ul>
        <li><strong>Schedule meetings in advance</strong> — give members at least a week's notice for better attendance. Last-minute meetings tend to have low turnout, especially for members working shifts.</li>
        <li><strong>Use the poster</strong> — print it for bulletin boards in the workplace, share it in group chats, or post it on social media. A visual reminder is far more effective than a text-only notification.</li>
        <li><strong>Set up Zoom API integration</strong> — if your local uses Zoom regularly, connect the Zoom API in your union settings. The auto-create feature generates meeting links, IDs, and passwords automatically without you ever leaving UnionTab.</li>
        <li><strong>Copy the meeting link</strong> — share it via text message, WhatsApp, Facebook groups, or any other channel your members use. The more places you share it, the better your attendance.</li>
        <li><strong>Use Send Invites strategically</strong> — send an initial invitation when the meeting is created, then send again a day or two before the meeting to catch anyone who missed the first one. UnionTab only sends to members who haven't received an invite yet, so there's no risk of spamming.</li>
      </ul>

      <h2>Meetings vs. Events: A Quick Recap</h2>

      <p>To avoid confusion, here's the key distinction:</p>

      <ul>
        <li><strong>Meetings</strong> (covered in this tutorial) are for <strong>online video conferences</strong> — they include a platform, join link, meeting ID, and password. Use these for virtual general membership meetings, steward check-ins, committee calls, and bargaining updates.</li>
        <li><strong>Events</strong> are for <strong>general calendar items</strong> — in-person gatherings, social events, training sessions, rallies, and anything that doesn't require a video link.</li>
      </ul>

      <p>Both features are available under the Tools mega-menu, so you can manage your local's entire schedule from one place.</p>
    `,
    imageUrl: "/assets/blog/zoom-meetings-and-posters/0.png",
    author: "UnionTab Team",
    publishedAt: "2025-11-10",
    readTime: "8 min read",
    tags: ["Tutorial", "Meetings", "Zoom", "Events"]
  },
  {
    id: "streamlining-union-administration",
    title: "Modernize Your Union Admin",
    excerpt: "Discover how forward-thinking unions are modernizing their administrative processes to better serve members and reduce operational overhead.",
    content: `
      <h2>The Challenge of Union Administration in the Digital Age</h2>
      <p>Union leaders today face an unprecedented challenge: managing complex administrative tasks while maintaining the personal connections that make unions powerful. From tracking member dues and managing grievances to coordinating elections and communicating updates, the workload can be overwhelming.</p>

      <p>Many unions still rely on spreadsheets, paper forms, and disconnected systems that create inefficiencies and increase the risk of errors. According to recent surveys, union administrators spend an average of 15-20 hours per week on routine administrative tasks that could be automated.</p>

      <h2>Key Areas for Improvement</h2>

      <h3>1. Membership Management</h3>
      <p>Keeping track of member information, dues status, and contact details is foundational to union operations. Modern solutions allow for centralized databases that automatically update and can be accessed by authorized personnel from anywhere.</p>

      <h3>2. Communication and Announcements</h3>
      <p>Effective communication is the lifeblood of any union. Whether it's contract updates, meeting notices, or urgent alerts, getting information to members quickly and reliably is essential. Email alone often isn't enough—members need multiple channels to stay informed.</p>

      <h3>3. Grievance Tracking</h3>
      <p>Managing grievances requires careful documentation, timeline tracking, and coordination between shop stewards, union representatives, and members. A systematic approach ensures no grievance falls through the cracks and helps identify patterns that may indicate larger issues.</p>

      <h3>4. Financial Transparency</h3>
      <p>Members deserve to know how their dues are being used. Clear financial reporting builds trust and demonstrates responsible stewardship of union resources.</p>

      <h2>The Technology Solution</h2>
      <p>Platforms like <strong>UnionTab</strong> are designed specifically for labor organizations, providing all-in-one solutions that address these challenges. Unlike generic business software, union-focused tools understand the unique needs of labor organizations—from seniority tracking to contract management.</p>

      <p>When evaluating administrative solutions, union leaders should look for:</p>
      <ul>
        <li>Ease of use for non-technical staff</li>
        <li>Mobile accessibility for members and officers</li>
        <li>Robust security to protect member data</li>
        <li>Affordable pricing that respects union budgets</li>
        <li>Features designed specifically for union operations</li>
      </ul>

      <h2>Getting Started</h2>
      <p>Modernizing your union's administration doesn't have to happen overnight. Start by identifying your biggest pain points and look for solutions that address those specific needs. Many unions find that even small improvements—like moving from paper to digital grievance tracking—can save dozens of hours each month.</p>

      <p>The goal isn't technology for technology's sake. It's about freeing up time and energy so union leaders can focus on what matters most: fighting for their members.</p>
    `,
    imageUrl: "/assets/blog/modernize-admin.jpg",
    author: "UnionTab Team",
    publishedAt: "2025-08-20",
    readTime: "6 min read",
    tags: ["Union Administration", "Digital Transformation", "Best Practices"]
  },
  {
    id: "running-fair-union-elections",
    title: "Run Fair & Transparent Elections",
    excerpt: "Learn the essential steps for conducting democratic union elections that build member trust and comply with federal regulations.",
    content: `
      <h2>Why Election Integrity Matters</h2>
      <p>Union elections are the foundation of democratic governance in labor organizations. When members trust the election process, they're more engaged, more supportive of leadership, and more willing to participate in union activities. Conversely, contested or questionable elections can divide membership and undermine union solidarity.</p>

      <p>The Labor-Management Reporting and Disclosure Act (LMRDA) sets minimum standards for union elections, but best practices go beyond mere compliance to create truly transparent processes.</p>

      <h2>Essential Steps for Election Success</h2>

      <h3>1. Establish Clear Timelines</h3>
      <p>Well-run elections require advance planning. Typical timelines include:</p>
      <ul>
        <li>90 days before: Announce election date and positions</li>
        <li>60 days before: Open nomination period</li>
        <li>45 days before: Close nominations, verify eligibility</li>
        <li>30 days before: Finalize ballot, distribute candidate information</li>
        <li>14 days before: Send voting instructions to all eligible members</li>
      </ul>

      <h3>2. Ensure Equal Access for Candidates</h3>
      <p>All candidates must have equal opportunity to campaign. This includes equal access to membership lists (within privacy guidelines), equal space in union publications, and equal time at membership meetings.</p>

      <h3>3. Protect Ballot Secrecy</h3>
      <p>Members must be able to vote without fear of retaliation or peer pressure. Whether using paper ballots or digital voting, the system must guarantee anonymity while preventing fraud.</p>

      <h3>4. Use Independent Election Oversight</h3>
      <p>Consider appointing an independent election committee or hiring an outside organization to oversee the process. This adds credibility and protects against accusations of bias.</p>

      <h3>5. Document Everything</h3>
      <p>Maintain detailed records of every step: nomination forms, eligibility determinations, ballot counts, and any challenges. Good documentation protects against disputes and demonstrates compliance with LMRDA requirements.</p>

      <h2>Leveraging Technology for Better Elections</h2>
      <p>Modern election tools can significantly improve both the administration and integrity of union elections. Digital platforms like <strong>UnionTab</strong> offer built-in election features that:</p>
      <ul>
        <li>Automatically verify member eligibility based on dues status and membership duration</li>
        <li>Provide secure, anonymous digital voting options</li>
        <li>Generate real-time results with complete audit trails</li>
        <li>Send automated reminders to increase participation</li>
        <li>Archive all election materials for compliance documentation</li>
      </ul>

      <h2>Common Pitfalls to Avoid</h2>
      <p><strong>Insufficient notice:</strong> Always provide more notice than the minimum required. Members need time to consider candidates and make informed decisions.</p>
      <p><strong>Unclear eligibility rules:</strong> Publish clear, specific eligibility requirements for both voters and candidates well in advance.</p>
      <p><strong>Poor turnout:</strong> Low participation weakens the mandate of elected leaders. Use multiple communication channels and make voting as accessible as possible.</p>

      <h2>Building Long-Term Trust</h2>
      <p>Each successful election builds confidence in your union's democratic processes. By consistently running fair, transparent elections, you create a culture of accountability that strengthens the entire organization.</p>
    `,
    imageUrl: "/assets/blog/elections.jpg",
    author: "UnionTab Team",
    publishedAt: "2025-07-05",
    readTime: "7 min read",
    tags: ["Union Elections", "Compliance", "Member Engagement"]
  },
  {
    id: "effective-grievance-management",
    title: "Master Grievance Handling",
    excerpt: "Master the art of grievance handling with proven strategies that protect member rights while building constructive relationships with management.",
    content: `
      <h2>The Critical Role of Grievance Handling</h2>
      <p>Grievance handling is one of the most important functions a union performs. When done well, it protects individual members from unfair treatment, enforces the collective bargaining agreement, and demonstrates the union's value to the entire membership. When done poorly, it erodes trust and can even expose the union to duty of fair representation claims.</p>

      <h2>Building an Effective Grievance System</h2>

      <h3>Intake and Documentation</h3>
      <p>Every grievance starts with a complaint. The key at this stage is thorough documentation:</p>
      <ul>
        <li>Record the who, what, when, where, and why</li>
        <li>Identify the specific contract provisions allegedly violated</li>
        <li>Gather supporting documents immediately (schedules, emails, witness statements)</li>
        <li>Note all relevant deadlines</li>
      </ul>

      <p>Many unions use standardized intake forms to ensure consistency. Digital systems like <strong>UnionTab</strong> provide grievance tracking features that capture all necessary information and automatically calculate deadlines based on your contract's timelines.</p>

      <h3>Investigation Best Practices</h3>
      <p>Before proceeding with a grievance, conduct a thorough investigation:</p>
      <ul>
        <li>Interview the grievant and all witnesses separately</li>
        <li>Request relevant documents from management</li>
        <li>Review past grievances on similar issues</li>
        <li>Consult the contract language carefully</li>
        <li>Consider management's likely arguments</li>
      </ul>

      <h3>Strategic Decision-Making</h3>
      <p>Not every complaint should become a formal grievance. Evaluate each case based on:</p>
      <ul>
        <li>Strength of the contract language</li>
        <li>Quality of available evidence</li>
        <li>Potential precedential impact</li>
        <li>Member's goals and preferences</li>
        <li>Resources required to pursue</li>
      </ul>

      <h2>Managing the Grievance Process</h2>

      <h3>Step Meetings</h3>
      <p>Prepare thoroughly for each step meeting. Know the contract inside and out, anticipate management's arguments, and have your evidence organized. Present the case clearly and professionally while remaining firm on the merits.</p>

      <h3>Tracking and Follow-Up</h3>
      <p>With multiple grievances at various stages, tracking becomes critical. Missed deadlines can waive grievances entirely. A centralized tracking system ensures nothing falls through the cracks.</p>

      <h3>Communication with Members</h3>
      <p>Keep grievants informed throughout the process. Even when the news isn't what they want to hear, members appreciate transparency. Document all communications.</p>

      <h2>Technology as a Force Multiplier</h2>
      <p>Modern grievance management tools transform how unions handle cases. Platforms designed for union operations provide:</p>
      <ul>
        <li>Centralized case files accessible to all authorized representatives</li>
        <li>Automatic deadline tracking and reminders</li>
        <li>Historical search to find relevant past grievances</li>
        <li>Secure document storage</li>
        <li>Reporting tools to identify patterns and trends</li>
      </ul>

      <h2>Building Institutional Knowledge</h2>
      <p>Every resolved grievance is a learning opportunity. Document outcomes and reasoning, especially arbitration decisions. This institutional knowledge helps stewards and officers handle future cases more effectively and builds the union's expertise over time.</p>

      <h2>The Bigger Picture</h2>
      <p>While individual grievances address specific problems, patterns in grievances often reveal systemic issues that should be addressed in contract negotiations. Use your grievance data to identify priorities for the next round of bargaining.</p>

      <p>Strong grievance handling is ultimately about showing members that their union has their back. Every well-handled case builds solidarity and demonstrates the value of collective representation.</p>
    `,
    imageUrl: "/assets/blog/grievance.jpg",
    author: "UnionTab Team",
    publishedAt: "2025-06-12",
    readTime: "8 min read",
    tags: ["Grievance Handling", "Member Rights", "Contract Enforcement"]
  }
];

export function getBlogPostById(id: string): BlogPost | undefined {
  return blogPosts.find(post => post.id === id);
}

export function getAllBlogPosts(): BlogPost[] {
  return blogPosts.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
