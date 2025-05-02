import discord
from discord.ext import commands
from discord import app_commands
import aiohttp
import asyncio

intents = discord.Intents.default()
intents.members = True
intents.guilds = True

AUTO_BAN_URL = "https://example.com/list-of-ids.txt"  # Replace with your actual URL


class BanBot(commands.Bot):
    def __init__(self, url):
        super().__init__(command_prefix="!", intents=intents)
        self.banlist_url = url

    async def on_ready(self):
        print(f"Bot is ready. Logged in as {self.user} (ID: {self.user.id})")
        # Starting the background task after the bot is ready
        self.bg_task = self.loop.create_task(self.auto_ban_task())

    async def auto_ban_task(self):
        await self.wait_until_ready()
        while not self.is_closed():
            for guild in self.guilds:
                await self.auto_ban_from_url(guild)
            await asyncio.sleep(30)

    async def auto_ban_from_url(self, guild):
        print(f"Running auto-ban for: {guild.name}")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.banlist_url) as resp:
                    if resp.status != 200:
                        print("Failed to fetch ban list.")
                        return
                    text = await resp.text()
        except Exception as e:
            print(f"Error fetching URL: {e}")
            return

        try:
            user_ids = {int(line.strip()) for line in text.splitlines() if line.strip().isdigit()}
        except ValueError:
            print("Failed to parse user IDs.")
            return

        for user_id in user_ids:
            member = guild.get_member(user_id)
            if member:
                try:
                    await member.ban(reason="Auto Banned from Blacklist")
                    print(f"Banned {member.name} ({member.id})")
                except Exception as e:
                    print(f"Failed to ban {member.name}: {e}")


bot = BanBot(url="w")


@bot.tree.command(name="banurl", description="Ban users from a list of IDs at a given URL.")
@app_commands.describe(url="Direct link to a plain text file with user IDs (one per line).")
async def banurl(interaction: discord.Interaction, url: str):
    if not interaction.user.guild_permissions.administrator:
        await interaction.response.send_message("You must be an administrator to use this command.", ephemeral=True)
        return

    await interaction.response.send_message("Fetching and processing the URL...", ephemeral=True)

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    await interaction.followup.send("Failed to fetch URL.")
                    return
                text = await resp.text()
    except Exception as e:
        await interaction.followup.send(f"Error fetching URL: {e}")
        return

    try:
        user_ids = {int(line.strip()) for line in text.splitlines() if line.strip().isdigit()}
    except ValueError:
        await interaction.followup.send("Failed to parse IDs. Make sure it's one ID per line.")
        return

    banned = []
    not_found = []
    failed = []

    for user_id in user_ids:
        member = interaction.guild.get_member(user_id)
        if member:
            try:
                await member.ban(reason="Banned via /banurl command")
                banned.append(member.name)
            except Exception as e:
                failed.append((member.name, str(e)))
        else:
            not_found.append(str(user_id))

    summary = (
        f"Banned: {', '.join(banned) or 'None'}\n"
        f"Not in server: {', '.join(not_found) or 'None'}\n"
        f"Failed: {', '.join(name for name, _ in failed) or 'None'}"
    )

    await interaction.followup.send(summary)

bot.run("put your token here")
