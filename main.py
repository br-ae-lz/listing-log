import requests
from requests_testadapter import Resp
from bs4 import BeautifulSoup
import os

# Define adapter to open local webpage (for debug)
# (Stolen from https://stackoverflow.com/a/22989322)
class LocalFileAdapter(requests.adapters.HTTPAdapter):
    def build_response_from_file(self, request):
        file_path = request.url[7:]
        with open(file_path, 'rb') as file:
            buff = bytearray(os.path.getsize(file_path))
            file.readinto(buff)
            resp = Resp(buff)
            r = self.build_response(request, resp)

            return r

    def send(self, request, stream=False, timeout=None,
             verify=True, cert=None, proxies=None):

        return self.build_response_from_file(request)

# Test Facebook requests output by printing to local file
'''
page = requests.get("https://www.facebook.com/groups/110354088989367/")
f = open("test.txt", "w")
f.write(page.text)
f.close()
'''

# Open local test page to experiment with its HTML
requests_session = requests.session()
requests_session.mount('file://', LocalFileAdapter())
URL = "file://C:/Users/Braden/Desktop/programming/projects/sublet-scraper/index.html"
page = requests_session.get(URL)

soup = BeautifulSoup(page.content, "html.parser")