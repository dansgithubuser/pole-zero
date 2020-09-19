#! /usr/bin/env python3

#===== imports =====#
import argparse
import copy
import datetime
import http.server
import os
import re
import socketserver
import subprocess
import sys
import webbrowser

#===== args =====#
parser = argparse.ArgumentParser()
parser.add_argument('--run', '-r', action='store_true')
args = parser.parse_args()

#===== consts =====#
DIR = os.path.dirname(os.path.realpath(__file__))

#===== setup =====#
os.chdir(DIR)

#===== helpers =====#
def blue(text):
    return '\x1b[34m' + text + '\x1b[0m'

def timestamp():
    return '{:%Y-%m-%d %H:%M:%S.%f}'.format(datetime.datetime.now())

def invoke(
    *args,
    popen=False,
    no_split=False,
    stdout=False,
    quiet=False,
    **kwargs,
):
    if len(args) == 1 and not no_split:
        args = args[0].split()
    if not quiet:
        print(blue('-'*40))
        print(timestamp())
        print(os.getcwd()+'$', end=' ')
        for i, v in enumerate(args):
            if re.search(r'\s', v):
                v = v.replace("'", """ '"'"' """.strip())
                v = f"'{v}'"
            if i != len(args)-1:
                end = ' '
            else:
                end = ';\n'
            print(v, end=end)
        if kwargs: print(kwargs)
        if popen: print('popen')
        print()
    if kwargs.get('env'):
        env = copy.copy(os.environ)
        env.update(kwargs['env'])
        kwargs['env'] = env
    if popen:
        return subprocess.Popen(args, **kwargs)
    else:
        if 'check' not in kwargs: kwargs['check'] = True
        if stdout: kwargs['capture_stdout'] = True
        result = subprocess.run(args, **kwargs)
        if stdout:
            result = result.stdout.decode('utf-8').strip()
        return result

#===== main =====#
if len(sys.argv) == 1:
    parser.print_help()
    sys.exit()

if args.run:
    webbrowser.open_new_tab('http://localhost:8000/index.html')
    with socketserver.TCPServer(
        ('', 8000),
        http.server.SimpleHTTPRequestHandler
    ) as httpd:
        httpd.serve_forever()
